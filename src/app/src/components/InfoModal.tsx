import React from 'react';
import BugReportIcon from '@mui/icons-material/BugReport';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ForumIcon from '@mui/icons-material/Forum';
import GitHubIcon from '@mui/icons-material/GitHub';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const links: { icon: JSX.Element; text: string; href: string }[] = [
  {
    icon: <MenuBookIcon fontSize="small" />,
    text: 'Airside Labs Website',
    href: 'https://airsidelabs.com',
  },
  {
    icon: <CalendarTodayIcon fontSize="small" />,
    text: 'Book a Meeting',
    href: 'https://cal.com/airsidelabs/15min',
  },
];

export default function InfoModal<T extends { open: boolean; onClose: () => void }>({
  open,
  onClose,
}: T) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="about-airside-dialog-title"
    >
      <DialogTitle id="about-airside-dialog-title">
        <Stack>
          <Typography variant="h6">About Airside Labs</Typography>
          <Typography variant="subtitle2">
            Version {import.meta.env.VITE_PROMPTFOO_VERSION}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Airside Labs provides AI security testing and evaluation services. This application is built using Promptfoo, an MIT licensed open-source tool for evaluating and red-teaming LLMs.
        </Typography>
        <Stack spacing={2} mt={2}>
          {links.map((item, index) => (
            <Stack
              key={index}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                flexWrap: 'wrap',
                '& .MuiSvgIcon-root': {
                  color: 'text.primary',
                },
              }}
            >
              {item.icon}
              <Link
                underline="none"
                target="_blank"
                href={item.href}
                sx={{
                  color: 'inherit',
                }}
              >
                <Typography variant="body2">{item.text}</Typography>
              </Link>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
