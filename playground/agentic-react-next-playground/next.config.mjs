import withAgenticReactNext from '@agentic-react/next';

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
};

export default withAgenticReactNext(nextConfig, {
  toolkit: {
    tuningModal: {
      classNames: {
        surface: 'next-playground-tuning-surface',
        panel: 'next-playground-tuning-panel',
        control: 'next-playground-tuning-control',
      },
      tokens: {
        panelRadius: '12px',
        controlRadius: '9px',
        primaryButtonBackground: '#7c2d12',
        primaryButtonColor: '#ffffff',
        panelShadow: '0 24px 72px rgba(124, 45, 18, 0.2)',
      },
      styles: {
        surface: {
          filter: 'drop-shadow(0 18px 40px rgba(124, 45, 18, 0.14))',
        },
        panel: {
          border: '1px solid rgba(124, 45, 18, 0.24)',
        },
        targetTag: {
          background: '#fff7ed',
          color: '#7c2d12',
        },
        sectionTitle: {
          color: '#7c2d12',
        },
      },
    },
  },
});
