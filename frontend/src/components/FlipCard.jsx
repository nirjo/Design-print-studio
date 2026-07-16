import React from 'react';
import './FlipCard.css';

/**
 * A reusable flip‑card component that provides a 3‑D rotation effect.
 * Props:
 *  - front: React node for the front side.
 *  - back: React node for the back side.
 *  - flipped: boolean indicating whether the card is showing the back.
 *  - onClick: optional click handler to toggle flip state.
 */
export default function FlipCard({ front, back, flipped, onClick }) {
  return (
    <div className='flip-card' onClick={onClick} data-testid='flip-card'>
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}> {/* preserve‑3d */}
        <div className='flip-card-front'>{front}</div>
        <div className='flip-card-back'>{back}</div>
      </div>
    </div>
  );
}
