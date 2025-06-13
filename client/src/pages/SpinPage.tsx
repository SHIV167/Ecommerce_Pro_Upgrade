import React from 'react';
import SpinWheel from '../components/SpinWheel';

interface SpinPageProps {
  campaignId: string;
}

const SpinPage: React.FC<SpinPageProps> = ({ campaignId }) => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-6">Spin & Win</h1>
    <SpinWheel campaignId={campaignId} />
  </div>
);

export default SpinPage;
