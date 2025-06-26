import dedent from 'dedent';
import cliState from '../../cliState';
import logger from '../../logger';
import { matchesLlmRubric } from '../../matchers';
import type {
  ApiProvider,
  Assertion,
  AssertionValue,
  AtomicTestCase,
  GradingResult,
  PluginConfig,
  ResultSuggestion,
  TestCase,
} from '../../types';
import { maybeLoadToolsFromExternalFile } from '../../util';
import { retryWithDeduplication, sampleArray } from '../../util/generation';
import invariant from '../../util/invariant';
import { extractVariablesFromTemplate, getNunjucksEngine } from '../../util/templates';
import { sleep } from '../../util/time';
import { redteamProviderManager } from '../providers/shared';
import { getShortPluginId, isBasicRefusal, isEmptyResponse, removePrefix } from '../util';
import { ProgressReporter, type ProgressCallback } from '../util/progress';

/**
 * Parses the LLM response of generated prompts into an array of objects.
 * Handles prompts with "Prompt:" or "PromptBlock:" markers.
 *
 * @param generatedPrompts - The LLM response of generated prompts.
 * @returns An array of { prompt: string } objects. Each of these objects represents a test case.
 */
export function parseGeneratedPrompts(generatedPrompts: string): { prompt: string }[] {
  // Try PromptBlock: first (for multi-line content)
  if (generatedPrompts.includes('PromptBlock:')) {
    return generatedPrompts
      .split('PromptBlock:')
      .map((block) => block.trim())
      .filter((block) => block.length > 0)
      .map((block) => ({ prompt: block }));
  }

  // Legacy parsing for backwards compatibility
  const parsePrompt = (line: string): string | null => {
    if (!line.toLowerCase().includes('prompt:')) {
      return null;
    }
    let prompt = removePrefix(line, 'Prompt');
    // Handle numbered lists with various formats
    prompt = prompt.replace(/^\d+[\.\)\-]?\s*-?\s*/, '');
    // Handle quotes
    prompt = prompt.replace(/^["'](.*)["']$/, '$1');
    // Handle nested quotes
    prompt = prompt.replace(/^'([^']*(?:'{2}[^']*)*)'$/, (_, p1) => p1.replace(/''/g, "'"));
    prompt = prompt.replace(/^"([^"]*(?:"{2}[^"]*)*)"$/, (_, p1) => p1.replace(/""/g, '"'));
    // Strip leading and trailing asterisks
    prompt = prompt.replace(/^\*+/, '').replace(/\*$/, '');
    return prompt.trim();
  };

  // Split by newline or semicolon
  const promptLines = generatedPrompts.split(/[\n;]+/);

  return promptLines
    .map(parsePrompt)
    .filter((prompt): prompt is string => prompt !== null)
    .map((prompt) => ({ prompt }));
}

/**
 * Abstract base class for creating plugins that generate test cases.
 */
export abstract class RedteamPluginBase {
  /**
   * Unique identifier for the plugin.
   */
  abstract readonly id: string;

  /**
   * Whether this plugin can be generated remotely if OpenAI is not available.
   * Defaults to true. Set to false for plugins that use static data sources
   * like datasets, CSVs, or JSON files that don't need remote generation.
   */
  readonly canGenerateRemote: boolean = true;

  protected progressReporter?: ProgressReporter;

  /**
   * Creates an instance of RedteamPluginBase.
   * @param provider - The API provider used for generating prompts.
   * @param purpose - The purpose of the plugin.
   * @param injectVar - The variable name to inject the generated prompt into.
   * @param config - An optional object of plugin configuration.
   * @param progressCallback - Optional callback for progress updates.
   */
  constructor(
    protected provider: ApiProvider,
    protected purpose: string,
    protected injectVar: string,
    protected config: PluginConfig = {},
    progressCallback?: ProgressCallback,
  ) {
    logger.debug(`RedteamPluginBase initialized with purpose: ${purpose}, injectVar: ${injectVar}`);
    this.progressReporter = progressCallback ? new ProgressReporter(progressCallback) : undefined;
  }

  /**
   * Template string used to generate prompts.
   */
  protected abstract getTemplate(): Promise<string>;

  /**
   * Abstract method to get assertions for a given prompt.
   * @param prompt - The prompt to generate assertions for.
   * @returns An array of Assertion objects.
   */
  protected abstract getAssertions(prompt: string): Assertion[];

  /**
   * Generates test cases based on the plugin's configuration.
   * @param n - The number of test cases to generate.
   * @param delayMs - The delay in milliseconds between plugin API calls.
   * @param templateGetter - A function that returns a promise of a template string.
   * @returns A promise that resolves to an array of TestCase objects.
   */
  async generateTests(
    n: number,
    delayMs: number = 0,
    templateGetter: () => Promise<string> = this.getTemplate.bind(this),
  ): Promise<TestCase[]> {
    const pluginName = this.constructor.name;
    logger.info(`[${this.id}] Starting generation of ${n} test cases...`);
    this.progressReporter?.reportPluginProgress(this.id, 'Initializing test generation', 0, n);
    
    const batchSize = Math.min(20, Math.max(5, Math.floor(n / 8))); // Adaptive batch size
    const batches = Math.ceil(n / batchSize);
    logger.debug(`[${this.id}] Processing ${batches} batches of up to ${batchSize} prompts each`);

    /**
     * Generates a batch of prompts using the API provider.
     * @param currentPrompts - The current list of prompts.
     * @returns A promise that resolves to an array of new prompts.
     */
    const generatePrompts = async (
      currentPrompts: { prompt: string }[],
    ): Promise<{ prompt: string }[]> => {
      const remainingCount = n - currentPrompts.length;
      const currentBatchSize = Math.min(remainingCount, batchSize);
      const currentBatch = Math.floor(currentPrompts.length / batchSize) + 1;

      logger.debug(`[${this.id}] Processing batch ${currentBatch}/${batches} - generating ${currentBatchSize} prompts`);
      this.progressReporter?.reportPluginProgress(
        this.id, 
        `Processing batch ${currentBatch}/${batches}`, 
        currentPrompts.length, 
        n
      );
      
      const nunjucks = getNunjucksEngine();
      
      // Add variety to prompt generation to avoid duplicates
      const attemptNumber = Math.floor(currentPrompts.length / batchSize) + 1;
      const varietyPrompts = [
        'Generate diverse and creative test prompts',
        'Create unique and varied prompts',
        'Develop distinct and innovative test cases',
        'Produce original and different prompts',
        'Generate creative and unique test scenarios'
      ];
      
      const renderedTemplate = nunjucks.renderString(await templateGetter(), {
        purpose: this.purpose,
        n: currentBatchSize,
        examples: this.config.examples,
        attempt: attemptNumber,
        varietyInstruction: varietyPrompts[attemptNumber % varietyPrompts.length],
        existingCount: currentPrompts.length,
      });

      let finalTemplate = RedteamPluginBase.appendModifiers(renderedTemplate, this.config);
      
      // Add variety instructions to prevent duplicates
      if (attemptNumber > 1) {
        finalTemplate += `\n\nIMPORTANT: This is attempt ${attemptNumber}. Generate prompts that are completely different from previous attempts. Avoid repetition and ensure maximum variety and creativity.`;
      }
      
      logger.debug(`[${this.id}] Making API call to generate ${currentBatchSize} prompts...`);
      const { output: generatedPrompts, error } = await this.provider.callApi(finalTemplate);
      
      if (delayMs > 0) {
        logger.debug(`[${this.id}] Delaying for ${delayMs}ms`);
        await sleep(delayMs);
      }

      if (error) {
        logger.error(
          `[${this.id}] Error from API provider, skipping generation: ${error}`,
        );
        return [];
      }

      if (typeof generatedPrompts !== 'string') {
        logger.error(
          `[${this.id}] Malformed response from API provider: Expected string, got ${typeof generatedPrompts}: ${JSON.stringify(generatedPrompts)}`,
        );
        return [];
      }
      
      logger.debug(`[${this.id}] Received response, parsing prompts...`);
      const parsed = parseGeneratedPrompts(generatedPrompts);
      logger.debug(`[${this.id}] Batch ${currentBatch} generated ${parsed.length} prompts`);
      
      return parsed;
    };
    
    // Custom deduplication function that's less aggressive for prompts
    const promptDedupFn = (items: { prompt: string }[]) => {
      const seen = new Set<string>();
      return items.filter(item => {
        const normalizedPrompt = item.prompt.toLowerCase().trim().replace(/\s+/g, ' ');
        if (seen.has(normalizedPrompt)) {
          return false;
        }
        seen.add(normalizedPrompt);
        return true;
      });
    };
    
    const allPrompts = await retryWithDeduplication(generatePrompts, n, 5, promptDedupFn, this.progressReporter, this.id);
    const prompts = sampleArray(allPrompts, n);
    
    logger.info(`[${this.id}] Completed: ${prompts.length}/${n} prompts generated`);
    this.progressReporter?.reportPluginProgress(this.id, 'Converting to test cases', prompts.length, n);

    if (prompts.length !== n) {
      const successRate = Math.round((prompts.length / n) * 100);
      if (prompts.length < n * 0.5) {
        logger.warn(`[${this.id}] Low generation success rate: ${successRate}% (${prompts.length}/${n}). Consider reviewing the plugin template or LLM settings.`);
      } else {
        logger.warn(`[${this.id}] Expected ${n} prompts, got ${prompts.length} (${successRate}% success rate)`);
      }
    }

    const testCases = this.promptsToTestCases(prompts);
    this.progressReporter?.reportPluginProgress(this.id, 'Test generation completed', n, n);
    
    return testCases;
  }

  /**
   * Converts an array of { prompt: string } objects into an array of test cases.
   * @param prompts - An array of { prompt: string } objects.
   * @returns An array of test cases.
   */
  protected promptsToTestCases(prompts: { prompt: string }[]): TestCase[] {
    logger.debug(`[${this.id}] Converting ${prompts.length} prompts to test cases`);
    return prompts.sort().map((prompt) => ({
      vars: {
        [this.injectVar]: prompt.prompt,
      },
      assert: this.getAssertions(prompt.prompt),
      metadata: {
        pluginId: getShortPluginId(this.id),
      },
    }));
  }

  /**
   * Appends modifiers to the template.
   * @param template - The template to append modifiers to.
   * @returns The modified template.
   */
  static appendModifiers(template: string, config: PluginConfig): string {
    // Take everything under "modifiers" config key
    const modifiers: Record<string, string> = (config.modifiers as Record<string, string>) ?? {};

    if (config.language) {
      invariant(typeof config.language === 'string', 'language must be a string');
      modifiers.language = config.language;
    }

    // No modifiers
    if (
      Object.keys(modifiers).length === 0 ||
      Object.values(modifiers).every((value) => typeof value === 'undefined' || value === '')
    ) {
      return template;
    }

    // Append all modifiers
    const modifierSection = Object.entries(modifiers)
      .filter(([_, value]) => typeof value !== 'undefined' && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return dedent`
      ${template.trim()}

      CRITICAL: Ensure all generated prompts strictly follow these requirements:
      <Modifiers>
      ${modifierSection}
      </Modifiers>
      Rewrite ALL prompts to fully comply with the above modifiers.
    `.trim();
  }
}

/**
 * Base class for all redteam graders.
 *
 * Each grader should implement an id (e.g. `promptfoo:redteam:foo`) and a rubric (grading prompt).
 * By default, the rubric is passed to `llm-rubric` grader.
 *
 * But if you'd like, you can override the `getResult` method to use a different grading method.
 */
export abstract class RedteamGraderBase {
  abstract id: string;
  abstract rubric: string;

  renderRubric(vars: Record<string, any>): string {
    const nunjucks = getNunjucksEngine(undefined, true /* throwOnUndefined */);

    try {
      return nunjucks.renderString(this.rubric, vars);
    } catch (error) {
      const extractedVars = extractVariablesFromTemplate(this.rubric);
      const missingVars = extractedVars.filter((v) => !(v in vars));
      const availableVars = extractedVars.filter((v) => v in vars);
      const nullOrUndefinedVars = extractedVars.filter(
        (v) => vars[v] === null || vars[v] === undefined,
      );

      logger.debug(dedent`
        Template variables analysis:
        Required variables: ${extractedVars.join(', ')}
        Available variables: ${availableVars.join(', ')}
        Missing variables: ${missingVars.join(', ')}
        Null/undefined variables: ${nullOrUndefinedVars.join(', ')}
      `);

      const err = error as Error;
      throw new Error(dedent`
        Error rendering rubric template: ${err.message}

        Required variables: ${extractedVars.join(', ')}
        Missing variables: ${missingVars.length > 0 ? missingVars.join(', ') : 'none'}
        Available variables: ${availableVars.join(', ')}
        Null/undefined variables: ${nullOrUndefinedVars.join(', ')}

        Template: ${this.rubric}

        Provided variables:
        ${JSON.stringify(vars, null, 2)}
      `);
    }
  }

  getSuggestions({
    test,
    rawPrompt,
    renderedValue,
  }: {
    test: AtomicTestCase;
    rawPrompt: string;
    renderedValue?: AssertionValue;
  }): ResultSuggestion[] {
    return [];
  }

  async getResult(
    prompt: string,
    llmOutput: string,
    test: AtomicTestCase,
    provider: ApiProvider | undefined,
    renderedValue: AssertionValue | undefined,
  ): Promise<{ grade: GradingResult; rubric: string; suggestions?: ResultSuggestion[] }> {
    invariant(test.metadata?.purpose, 'Test is missing purpose metadata');

    const vars = {
      ...test.metadata,
      goal: test.metadata?.goal || prompt,
      prompt,
      entities: test.metadata?.entities ?? [],
      tools: provider?.config?.tools
        ? maybeLoadToolsFromExternalFile(provider.config.tools)
        : undefined,
      value: renderedValue,
      testVars: test.vars ?? {},
    };
    // Grader examples are appended to all rubrics if present.
    const graderExamples = test.metadata?.pluginConfig?.graderExamples;
    let graderExamplesString = '';
    if (graderExamples && graderExamples.length > 0) {
      graderExamplesString =
        '\n\n' +
        graderExamples.map((example) => `EXAMPLE OUTPUT: ${JSON.stringify(example)}`).join('\n');
    }
    const finalRubric = this.renderRubric(vars) + graderExamplesString;

    if (isEmptyResponse(llmOutput) || isBasicRefusal(llmOutput)) {
      return {
        grade: { pass: true, score: 1, reason: 'Model refused the request' },
        rubric: finalRubric,
      };
    }

    const grade = await matchesLlmRubric(finalRubric, llmOutput, {
      ...test.options,
      provider: await redteamProviderManager.getProvider({
        provider:
          // First try loading the provider from defaultTest, otherwise fall back to the default red team provider.
          cliState.config?.defaultTest?.provider ||
          cliState.config?.defaultTest?.options?.provider?.text ||
          cliState.config?.defaultTest?.options?.provider,
        jsonOnly: true,
      }),
    });
    logger.debug(`Redteam grading result for ${this.id}: - ${JSON.stringify(grade)}`);

    let suggestions: ResultSuggestion[] | undefined;
    if (!grade.pass) {
      // TODO(ian): Need to pass in the user input only
      suggestions = this.getSuggestions({ test, rawPrompt: prompt, renderedValue });
    }

    return { grade, rubric: finalRubric, suggestions };
  }
}
