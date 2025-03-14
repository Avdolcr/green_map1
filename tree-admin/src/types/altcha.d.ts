declare module 'altcha' {
  import { FC } from 'react';
  interface AltchaProps {
    auto?: boolean;
    challengeurl: string;
    className?: string;
    apikey: string;
    onVerify?: (event: { detail: { challenge: string } }) => void;
  }
  export const Altcha: FC<AltchaProps>;
}