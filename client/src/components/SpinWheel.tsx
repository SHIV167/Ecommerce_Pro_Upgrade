import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';

interface Prize {
  title: string;
  weight: number;
  color?: string;
}

interface SpinCampaign {
  _id: string;
  name: string;
  prizes: Prize[];
}

type SpinWheelProps = {
  campaignId: string;
};

const defaultColors = ['#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF','#FFA500','#800080'];

const SpinWheel: React.FC<SpinWheelProps> = ({ campaignId }) => {
  const [campaign, setCampaign] = useState<SpinCampaign | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [prize, setPrize] = useState<Prize | null>(null);

  useEffect(() => {
    fetch(`/api/spin-campaigns/${campaignId}`)
      .then((res) => res.json())
      .then((data) => setCampaign(data))
      .catch((err) => console.error('Error loading campaign', err));
  }, [campaignId]);

  if (!campaign) return <div>Loading campaign...</div>;

  const prizes = campaign.prizes ?? [];
  if (prizes.length === 0) return <div>No prizes available</div>;
  const data = prizes.map((p, idx) => ({
    option: p.title,
    style: {
      backgroundColor: p.color || defaultColors[idx % defaultColors.length],
      textColor: '#fff',
    },
  }));

  const handleSpin = () => {
    const totalWeight = campaign.prizes.reduce((sum, p) => sum + p.weight, 0);
    let rnd = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < campaign.prizes.length; i++) {
      rnd -= campaign.prizes[i].weight;
      if (rnd <= 0) {
        selectedIndex = i;
        break;
      }
    }
    setPrizeNumber(selectedIndex);
    setMustSpin(true);

    fetch(`/api/spin-campaigns/${campaignId}/spin`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((pr) => setPrize(pr))
      .catch((err) => console.error('Spin error', err));
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        outerBorderColor="#333"
        outerBorderWidth={10}
        innerRadius={30}
        radiusLineColor="#333"
        radiusLineWidth={2}
        textDistance={60}
        fontSize={16}
        onStopSpinning={() => {
          setMustSpin(false);
          if (prize) {
            window.alert(`🎉 You won: ${prize.title}`);
          }
        }}
      />

      <button
        className="px-6 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
        onClick={handleSpin}
        disabled={mustSpin}
      >
        {mustSpin ? 'Spinning...' : 'Spin to Win'}
      </button>
    </div>
  );
};

export default SpinWheel;
