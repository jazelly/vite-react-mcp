import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

export function AppSurface({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        background:
          'linear-gradient(135deg, rgba(12, 74, 110, 0.08), transparent 34rem), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}

export function PageHeader({ eyebrow, title, description, icon, actions }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 3,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          alignItems: { xs: 'flex-start', md: 'center' },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          justifyContent: 'space-between',
          p: { xs: 3, md: 4 },
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'primary.main',
              boxShadow: '0 14px 34px rgba(14, 116, 144, 0.26)',
              height: 52,
              width: 52,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={800}>
              {eyebrow}
            </Typography>
            <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.25, maxWidth: 720 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
        {actions ? <Box>{actions}</Box> : null}
      </Box>
    </Paper>
  );
}

export function VisualBriefing({ imageSrc, title, body, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'grid',
        gap: 0,
        gridTemplateColumns: { xs: '1fr', lg: '1.08fr 0.92fr' },
        mb: 3,
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={imageSrc}
        alt=""
        sx={{
          aspectRatio: '16 / 9',
          display: 'block',
          height: '100%',
          objectFit: 'cover',
          width: '100%',
        }}
      />
      <Box sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.75, mt: 1.5 }}>
          {body}
        </Typography>
        {children ? <Box sx={{ mt: 3 }}>{children}</Box> : null}
      </Box>
    </Paper>
  );
}

export function MetricCard({ icon, label, value, tone = 'primary' }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: `${tone}.50`, color: `${tone}.main` }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {label}
            </Typography>
            <Typography variant="h5">{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ToolbarSurface({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 2,
        p: 2,
      }}
    >
      {children}
    </Paper>
  );
}

export function DataPanel({ title, subtitle, actions, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          justifyContent: 'space-between',
          p: 2.5,
        }}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? <Stack direction="row" spacing={1}>{actions}</Stack> : null}
      </Box>
      <Divider />
      {children}
    </Paper>
  );
}

export function StatusChip({ children, color = 'default', icon }) {
  return (
    <Chip
      icon={icon}
      color={color}
      label={children}
      size="small"
      sx={{ fontWeight: 800 }}
      variant={color === 'default' ? 'outlined' : 'filled'}
    />
  );
}
