import React from 'react';
import './evalBar.css';

interface EvalBarProps {
    score: number;
}

const EvalBar: React.FC<EvalBarProps> = ({ score }) => {
    // Clamp score between -5 and 5 for display purposes
    const clampedScore = Math.max(-5, Math.min(5, score));
    
    // Convert score to percentage (50% is neutral)
    const percentage = 50 - (clampedScore * 10);

    return (
        <div className="eval-bar-container">
            <div className="eval-bar">
                <div 
                    className="eval-bar-fill"
                    style={{ height: `${percentage}%` }}
                />
            </div>
            <div className="eval-score">{score.toFixed(1)}</div>
        </div>
    );
};

export default EvalBar;