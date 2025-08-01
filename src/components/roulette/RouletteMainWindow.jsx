import RouletteMainContainer from './RouletteMainContainer';
import RouletteSideContainer from './RouletteSideContainer';
import ResultContainer from '../ResultContainer';

import { useEffect, useRef, useState } from 'react';
import { ROULETTE_KOAF_VALUES, ROULETTE_HISTORY_ARRAY_LIMIT, ROULETTE_LAST_GAMES_ARRAY_LIMIT } from '../../data';

export default function RouletteMainWindow({
    balance,
    setBalance,

    spinInfo,
    setSpinInfo,

    isDisabled,
    setIsDisabled,

    historyArray,
    setHistoryArray,

    setLastGamesArray,

    setStatistics,
}) {
    // Left offsets
    const mainContainer = useRef();
    useEffect(() => {
        if (mainContainer.current) UpdateOffsets();
    }, [mainContainer.current]);
    const leftOffset = useRef(0);

    const leftStock1 = useRef(0);
    const leftStock2 = useRef(2400);
    const [left1, setLeft1] = useState(leftStock1.current + leftOffset.current);
    const [left2, setLeft2] = useState(leftStock2.current + leftOffset.current);

    window.addEventListener('resize', () => {
        if (mainContainer.current) UpdateOffsets();
    });

    function UpdateOffsets() {
        const offsetX = GetHalfOfContainer() - 600; // If arrow is 600px left margin by default
        leftOffset.current = offsetX;
        setLeft1(leftStock1.current + leftOffset.current);
        setLeft2(leftStock2.current + leftOffset.current);
    }

    function GetHalfOfContainer() {
        const widthContainer = window.getComputedStyle(mainContainer.current).width.replace('px', '');
        return widthContainer / 2;
    }

    // Roulette mechanics
    const [rouletteEndGame, setRouletteEndGame] = useState(false);
    useEffect(() => {
        if (rouletteEndGame) {
            FinishRouletteSpin();
            setRouletteEndGame(false);
        }
    }, [rouletteEndGame]);

    const rouletteSpeed = useRef(0);

    function StartRouletteSpin() {
        rouletteSpeed.current = 20 + Math.random() * 10; // From 20 to 30

        setIsDisabled(true);
        setBalance((prev) => prev - spinInfo.bet);
        UpdateStatistics('start');

        RouletteSpin();
    }

    function RouletteSpin() {
        UpdateBothParts(rouletteSpeed.current);

        // Move one part to the end of another if it is hidden
        const curLeft1 = leftStock1.current + leftOffset.current;
        const curLeft2 = leftStock2.current + leftOffset.current;
        if (curLeft1 < -200 && curLeft2 < -200) {
            if (curLeft1 < curLeft2) {
                leftStock1.current += 2400;
                setLeft1(leftStock1.current + leftOffset.current);
            } else {
                leftStock2.current += 2400;
                setLeft2(leftStock2.current + leftOffset.current);
            }
        }

        let multiplier;
        if (rouletteSpeed.current > 15) multiplier = 0.1;
        else if (rouletteSpeed.current > 10) multiplier = 0.08;
        else if (rouletteSpeed.current > 5) multiplier = 0.06;
        else if (rouletteSpeed.current > 2) multiplier = 0.04;
        else multiplier = 0.03;
        rouletteSpeed.current -= Math.random() * multiplier;

        if (rouletteSpeed.current <= 0) {
            rouletteSpeed.current = 0;

            setRouletteEndGame(true);
        } else setTimeout(RouletteSpin, 10);
    }

    function FinishRouletteSpin() {
        // If both parts are <- from arrow, arrow is pointing to most -> part;
        // If not, then one of the parts is -> from arrow and arrow is pointing to <- part
        const halfContainer = GetHalfOfContainer();
        let finalLeft =
            left1 < halfContainer && left2 < halfContainer ? (left1 < left2 ? left2 : left1) : left1 < halfContainer ? left1 : left2;
        console.log(`Final left is ${finalLeft}`);

        const finalColor = GetFinalColor(finalLeft);
        const isWin = spinInfo.color == finalColor;
        const bgColor = isWin ? '5C9E5E' : '9E5C5C';
        const profit = isWin ? spinInfo.bet * (ROULETTE_KOAF_VALUES[spinInfo.color] - 1) : spinInfo.bet;

        if (isWin) setBalance((prev) => prev + profit + spinInfo.bet);

        ShowGameResult(bgColor, finalColor, isWin, profit);
        UpdateHistoryAndLastGames(
            bgColor,
            spinInfo.color,
            finalColor,
            spinInfo.bet,
            isWin ? spinInfo.bet * ROULETTE_KOAF_VALUES[spinInfo.color] : 0
        );
        UpdateStatistics('finish', isWin, finalColor, spinInfo.bet * ROULETTE_KOAF_VALUES[spinInfo.color]);

        setIsDisabled(false);
    }

    function GetFinalColor(finalLeft) {
        finalLeft = Math.abs(-GetHalfOfContainer() + finalLeft);

        let nearestPosition;
        let distance = Infinity;

        for (let i = 40; i <= 2360; i += 80) {
            const newDistance = Math.abs(finalLeft - i);
            if (newDistance < distance) {
                distance = newDistance;
                nearestPosition = i;
            }
        }

        console.log(`Nearest position is ${nearestPosition}`);

        let rouletteColor;

        const PURPLE = [1160, 2360];
        const BLACK = [120, 280, 440, 600, 760, 920, 1080, 1240, 1400, 1560, 1720, 1880, 2040, 2200];
        const RED = [40, 200, 360, 520, 680, 840, 1000, 1320, 1480, 1640, 1800, 1960, 2120, 2280];

        if (PURPLE.includes(nearestPosition)) rouletteColor = 'Purple';
        else if (BLACK.includes(nearestPosition)) rouletteColor = 'Black';
        else if (RED.includes(nearestPosition)) rouletteColor = 'Red';

        console.log(`Final color is ${rouletteColor}`);

        return rouletteColor;
    }

    function UpdateBothParts(value) {
        leftStock1.current -= value;
        leftStock2.current -= value;
        setLeft1(leftStock1.current + leftOffset.current);
        setLeft2(leftStock2.current + leftOffset.current);
    }

    function ShowGameResult(bgColor, finalColor, isWin, profit) {
        const resultContainer = document.getElementById('resultContainer');
        const resultColor = document.getElementById('resultColor');
        const resultProfit = document.getElementById('resultProfit');

        resultContainer.style.display = 'flex';
        resultContainer.style.background = `radial-gradient(#${bgColor} 5%, #${bgColor}77)`;
        resultColor.textContent = `${finalColor} x${ROULETTE_KOAF_VALUES[finalColor]}`;
        resultProfit.textContent = isWin ? `+ ${profit} $` : `- ${profit} $`;

        setTimeout(() => (resultContainer.style.display = 'none'), 5000);
    }

    function UpdateHistoryAndLastGames(bgColor, userColor, finalColor, betBefore, betAfter) {
        setHistoryArray((prev) => {
            const current = [finalColor, ...prev];
            current.length > ROULETTE_HISTORY_ARRAY_LIMIT && current.pop();
            return current;
        });
        setLastGamesArray((prev) => {
            const current = [{ bgColor, userColor, finalColor, betBefore, betAfter }, ...prev];
            current.length > ROULETTE_LAST_GAMES_ARRAY_LIMIT && current.pop();
            return current;
        });
    }

    function UpdateStatistics(key, isWin, finalColor, moneyWon) {
        if (key == 'start') {
            setStatistics((stats) => ({
                ...stats,
                totalSpins: stats.totalSpins + 1,
                totalMoneyBet: stats.totalMoneyBet + spinInfo.bet,
                redChoosed: stats.redChoosed + (spinInfo.color == 'Red' ? 1 : 0),
                blackChoosed: stats.blackChoosed + (spinInfo.color == 'Black' ? 1 : 0),
                purpleChoosed: stats.purpleChoosed + (spinInfo.color == 'Purple' ? 1 : 0),
            }));
        } else if (key == 'finish') {
            setStatistics((stats) => ({
                ...stats,
                totalWins: stats.totalWins + (isWin ? 1 : 0),
                totalMoneyWon: stats.totalMoneyWon + (isWin ? moneyWon : 0),
                winPercentage: Math.round(((stats.totalWins + (isWin ? 1 : 0)) / stats.totalSpins) * 1000) / 10,
                moneyProfit: stats.totalMoneyWon + (isWin ? moneyWon : 0) - stats.totalMoneyBet,
                redWon: stats.redWon + (isWin && finalColor == 'Red' ? 1 : 0),
                blackWon: stats.blackWon + (isWin && finalColor == 'Black' ? 1 : 0),
                purpleWon: stats.purpleWon + (isWin && finalColor == 'Purple' ? 1 : 0),
            }));
        }
    }

    return (
        <div className='mainGameWindow' style={{ background: 'linear-gradient(to right, #50B85F, #3B9C96)' }}>
            <RouletteMainContainer reference={mainContainer} left1={left1} left2={left2} />
            <RouletteSideContainer
                balance={balance}
                spinInfo={spinInfo}
                setSpinInfo={setSpinInfo}
                isDisabled={isDisabled}
                StartEvent={StartRouletteSpin}
                historyArray={historyArray}
            />
            <ResultContainer />
        </div>
    );
}
