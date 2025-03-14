'use client';
import dynamic from 'next/dynamic';

const Altcha = dynamic(
  () => import('altcha').then((mod) => mod.Altcha),
  { ssr: false }
);

export default Altcha;