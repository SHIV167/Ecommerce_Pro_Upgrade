import React, { useState, useRef } from 'react';
import { FiCopy } from 'react-icons/fi';
import { FaCheck } from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import '../../styles/BestOffers.css';

interface Offer {
  title: string;
  description: string;
  code: string;
}

const offers: Offer[] = [
  {
    title: 'Free 3pc\nBestsellers',
    description: 'on orders above 799',
    code: 'GET3'
  },
  {
    title: 'Free\nLipstick',
    description: 'on orders above 499',
    code: 'FREELIPSTICK'
  },
  {
    title: 'Free 5pc\nBestsellers',
    description: 'on orders above 1499',
    code: 'GET5'
  }
];

export default function BestOffers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = direction === 'left' ? -280 : 280;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="best-offers">
      <h2 className="best-offers-title">BEST OFFERS</h2>
      <div className="offers-wrapper">
        <button 
          className="nav-button prev" 
          onClick={() => scroll('left')}
          aria-label="Previous offers"
        >
          <IoIosArrowBack />
        </button>
        <div className="offers-container" ref={containerRef}>
        {offers.map((offer, index) => (
          <div key={index} className="offer-card">
            <div className="offer-content">
              <div className="offer-text">
                <div className="corner-top-left" />
                <div className="corner-bottom-left" />
                <h3 className="offer-title">{offer.title}</h3>
                <p className="offer-description">{offer.description}</p>
                <div className="code-label">Use Code: <span>{offer.code}</span></div>
              </div>
              <div className="code-section">
                <div className="copy-code-label">COPY CODE</div>
                <button
                  onClick={() => copyToClipboard(offer.code)}
                  className="copy-button"
                  aria-label="Copy code"
                >
                  {copiedCode === offer.code ? <FaCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        <button 
          className="nav-button next" 
          onClick={() => scroll('right')}
          aria-label="Next offers"
        >
          <IoIosArrowForward />
        </button>
      </div>
    </div>
  );
}
