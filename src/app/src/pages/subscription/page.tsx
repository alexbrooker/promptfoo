import React, { useState, useEffect } from 'react';
import { useStripe } from '@app/hooks/useStripe';
import { useSubscription } from '@app/hooks/useSubscription';
import { useUserStore } from '@app/stores/userStore';
import { callApi, callAuthenticatedApi } from '@app/utils/api';
import { CheckCircle, Cancel, CreditCard, Receipt, Settings, AccountBalanceWallet } from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  interval: 'month' | 'year' | 'one-off';
  features: string[];
  isPopular?: boolean;
  active?: boolean;
  priceId?: string;
}

interface OneOffPayment {
  id: string;
  amount: number;
  date: number;
  status: string;
  description: string;
  downloadUrl: string;
}

// Plans will be fetched from backend

export default function SubscriptionPage() {
  const {
    subscription,
    loading: subscriptionLoading,
    error,
    updateSubscription,
  } = useSubscription();
  const { createCheckoutSession, createPortalSession, loading: stripeLoading } = useStripe();
  const { onboardingData, fetchOnboardingData } = useUserStore();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [oneOffPayments, setOneOffPayments] = useState<OneOffPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Fetch available plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await callApi('/stripe/plans');
        if (response.ok) {
          const plansData = await response.json();
          // Filter out inactive plans
          setPlans(plansData.filter((plan: SubscriptionPlan) => plan.active !== false));
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Fetch one-off payments
  useEffect(() => {
    const fetchOneOffPayments = async () => {
      try {
        const response = await callAuthenticatedApi('/stripe/payments/one-off');
        if (response.ok) {
          const paymentsData = await response.json();
          console.log('One-off payments received:', paymentsData);
          setOneOffPayments(paymentsData);
        } else {
          const errorData = await response.text();
          console.error('Failed to fetch one-off payments:', response.status, errorData);
        }
      } catch (error) {
        console.error('Failed to fetch one-off payments:', error);
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchOneOffPayments();
  }, []);

  // Fetch user profile data on component mount
  useEffect(() => {
    fetchOnboardingData();
  }, [fetchOnboardingData]);

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    try {
      // Pass the priceId and plan details to the checkout session
      await createCheckoutSession((plan as any).priceId || planId, {
        interval: plan.interval,
        name: plan.name,
      });
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      await createPortalSession();
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await updateSubscription({ status: 'canceled' });
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const formatPrice = (price: number, interval: string, discountedPrice?: number) => {
    if (interval === 'one-off') {
      return discountedPrice ? `$${discountedPrice} one-time` : `$${price} one-time`;
    }
    return discountedPrice ? `$${discountedPrice}/${interval}` : `$${price}/${interval}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'past_due':
        return 'warning';
      case 'canceled':
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  if (subscriptionLoading || plansLoading || paymentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Account Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Current Subscription Status */}
      {subscription && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Subscription
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Chip
                  label={subscription.status}
                  color={getStatusColor(subscription.status) as any}
                  icon={subscription.status === 'active' ? <CheckCircle /> : <Cancel />}
                />
              </Grid>
              <Grid item>
                <Typography variant="body1">
                  <strong>{subscription.planName}</strong> -{' '}
                  {formatPrice(
                    subscription.price,
                    subscription.interval,
                    subscription.discountedPrice,
                  )}
                </Typography>
              </Grid>
              <Grid item xs />
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={handleManageBilling}
                  disabled={stripeLoading}
                >
                  Manage Billing
                </Button>
              </Grid>
            </Grid>

            {subscription.status === 'active' && subscription.currentPeriodEnd && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Next billing date: {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
              </Typography>
            )}

            {subscription.status === 'past_due' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Your subscription is past due. Please update your payment method to continue using
                the service.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Credits Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scan Credits
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
            </Grid>
            <Grid item>
              <Typography variant="h4" component="span" color="primary">
                {onboardingData.scanCredits || 0}
              </Typography>
              <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                credits remaining
              </Typography>
            </Grid>
            <Grid item xs />
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSubscribe('quick_check')}
                disabled={stripeLoading}
              >
                Buy More Credits
              </Button>
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Total credits used: {onboardingData.creditsUsed || 0} • 
            Each scan consumes 1 credit • 
            Credits are refunded if scans fail early
          </Typography>
        </CardContent>
      </Card>

      {/* Available Plans */}
      {(!subscription || subscription.status === 'canceled') && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Choose Your Product
          </Typography>
          <Grid container spacing={3}>
            {plans
              .filter((plan) => plan.active !== false)
              .map((plan) => (
                <Grid item xs={12} md={4} key={plan.id}>
                  <Card
                    sx={{
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      ...(plan.isPopular && {
                        border: '2px solid',
                        borderColor: 'primary.main',
                      }),
                    }}
                  >
                    {plan.isPopular && (
                      <Chip
                        label="Most Popular"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, pt: plan.isPopular ? 3 : 2 }}>
                      <Typography variant="h5" component="h2" gutterBottom align="center">
                        {plan.name}
                      </Typography>
                      {plan.discountedPrice ? (
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Typography
                            variant="h3"
                            component="div"
                            color="primary"
                            sx={{ display: 'inline' }}
                          >
                            ${plan.discountedPrice}
                          </Typography>
                          <Typography
                            variant="body1"
                            component="span"
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through', ml: 1, verticalAlign: 'middle' }}
                          >
                            ${plan.price}
                          </Typography>
                          <Typography variant="body2" component="div" color="success.main">
                            {Math.round((1 - plan.discountedPrice / plan.price) * 100)}% OFF
                          </Typography>
                          {plan.interval !== 'one-off' && (
                            <Typography variant="body2" color="text.secondary">
                              /{plan.interval}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography
                          variant="h3"
                          component="div"
                          align="center"
                          color="primary"
                          gutterBottom
                        >
                          {formatPrice(plan.price, plan.interval)}
                        </Typography>
                      )}
                      {plan.interval === 'one-off' ? (
                        <Typography
                          variant="subtitle2"
                          align="center"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Single payment, no recurring charges
                        </Typography>
                      ) : plan.interval === 'month' ? (
                        <Typography
                          variant="subtitle2"
                          align="center"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Monthly subscription, cancel anytime
                        </Typography>
                      ) : (
                        <Typography
                          variant="subtitle2"
                          align="center"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Billed {plan.interval}ly, cancel anytime
                        </Typography>
                      )}
                      <List dense>
                        {plan.features.map((feature, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    <Box sx={{ p: 2 }}>
                      <Button
                        variant={plan.isPopular ? 'contained' : 'outlined'}
                        fullWidth
                        size="large"
                        startIcon={<CreditCard />}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={stripeLoading}
                      >
                        {stripeLoading ? (
                          <CircularProgress size={20} />
                        ) : plan.interval === 'one-off' ? (
                          'Buy Now'
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </>
      )}

      {/* One-Off Payments History */}
      {oneOffPayments.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Payment History
          </Typography>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <List>
                {oneOffPayments.map((payment, index) => (
                  <React.Fragment key={payment.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Receipt />
                      </ListItemIcon>
                      <ListItemText
                        primary={`$${(payment.amount / 100).toFixed(2)} - ${payment.description}`}
                        secondary={`${new Date(payment.date * 1000).toLocaleDateString()} - ${payment.status}`}
                      />
                      {payment.downloadUrl && (
                        <Button
                          size="small"
                          onClick={() => window.open(payment.downloadUrl, '_blank')}
                        >
                          Download Receipt
                        </Button>
                      )}
                    </ListItem>
                    {index < oneOffPayments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {/* Plan Change Options */}
      {subscription && subscription.status === 'active' && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Purchase additional scans or Change Plan
          </Typography>
          <Grid container spacing={3}>
            {plans
              .filter((plan) => plan.id !== subscription.planId && plan.active !== false)
              .map((plan) => (
                <Grid item xs={12} md={4} key={plan.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom align="center">
                        {plan.name}
                      </Typography>
                      {plan.discountedPrice ? (
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Typography
                            variant="h4"
                            component="div"
                            color="primary"
                            sx={{ display: 'inline' }}
                          >
                            ${plan.discountedPrice}
                          </Typography>
                          <Typography
                            variant="body1"
                            component="span"
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through', ml: 1, verticalAlign: 'middle' }}
                          >
                            ${plan.price}
                          </Typography>
                          <Typography variant="body2" component="div" color="success.main">
                            {Math.round((1 - plan.discountedPrice / plan.price) * 100)}% OFF
                          </Typography>
                          {plan.interval !== 'one-off' && (
                            <Typography variant="body2" color="text.secondary">
                              /{plan.interval}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography
                          variant="h4"
                          component="div"
                          align="center"
                          color="primary"
                          gutterBottom
                        >
                          {formatPrice(plan.price, plan.interval)}
                        </Typography>
                      )}
                      {plan.interval === 'one-off' ? (
                        <Typography
                          variant="subtitle2"
                          align="center"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Single payment, no recurring charges
                        </Typography>
                      ) : plan.interval === 'month' ? (
                        <Typography
                          variant="subtitle2"
                          align="center"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Monthly subscription, cancel anytime
                        </Typography>
                      ) : (
                        <Typography
                          variant="subtitle2"
                          align="center"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Billed {plan.interval}ly, cancel anytime
                        </Typography>
                      )}
                      <List dense>
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                        {plan.features.length > 3 && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={`+${plan.features.length - 3} more features`}
                              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    <Box sx={{ p: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={stripeLoading}
                      >
                        Change Plan
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button variant="text" color="error" onClick={() => setCancelDialogOpen(true)}>
              Cancel Subscription
            </Button>
          </Box>
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your subscription? You'll continue to have access until
            the end of your current billing period.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
          <Button onClick={handleCancelSubscription} color="error" variant="contained">
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
