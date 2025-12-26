import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Silent Pixels Vault',
  projectId: 'b73458d1d8f9492e9c3a1a9e2d6b62e4',
  chains: [sepolia],
  ssr: false,
});
