import React, { useState, useEffect, useRef } from 'react';
import GameBoard from './components/GameBoard';
import MathChallenge from './components/MathChallenge';
import { Player, Tile, TileType, MathQuestion, GameLog, MistakeRecord, Badge } from './types';
import { GAME_BOARD, INITIAL_MONEY, INITIAL_BADGES, BOARD_SIZE } from './constants';
import { generateMathQuestion } from './services/geminiService';
import { Coins, Play, History, TrendingUp, AlertTriangle, Users, Bot, UserPlus, Skull } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0); // Use index to track turn
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [board, setBoard] = useState<Tile[]>(GAME_BOARD);
  const [logs, setLogs] = useState<GameLog[]>([]);
  
  // Animation State
  const [upgradingTileId, setUpgradingTileId] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false); // Visual state for AI rolling
  
  // Math Challenge State
  const [showMathModal, setShowMathModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<((isCorrect: boolean) => void) | null>(null);
  
  // Stats
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef(players); // Keep track of latest players state

  // --- Effects ---

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Check Badges (Only for P1 for simplicity, or could be expanded)
  useEffect(() => {
    const p1 = players.find(p => p.id === 'P1');
    if (!p1) return;

    const newBadges = [...badges];
    let badgeChanged = false;

    if (!newBadges[0].unlocked && p1.properties.length > 0) {
      newBadges[0].unlocked = true;
      addLog("🏅 P1 解锁成就：第一桶金！", "success");
      badgeChanged = true;
    }
    if (!newBadges[1].unlocked && streak >= 5) {
      newBadges[1].unlocked = true;
      addLog("🏅 解锁成就：速算小能手！", "success");
      badgeChanged = true;
    }
    if (!newBadges[2].unlocked && p1.money >= 5000) {
      newBadges[2].unlocked = true;
      addLog("🏅 P1 解锁成就：上海首富！", "success");
      badgeChanged = true;
    }

    if (badgeChanged) setBadges(newBadges);
  }, [players, streak]);

  // Turn Orchestration
  useEffect(() => {
    if (!gameStarted || players.length === 0) return;

    const currentPlayer = players[activePlayerIndex];

    // Check for Bankruptcy / Skip Turn
    if (currentPlayer.isBankrupt) {
       // If current player is bankrupt, immediately move to next
       const activePlayers = players.filter(p => !p.isBankrupt);
       if (activePlayers.length <= 1) {
           // Game over is handled in bankruptcy trigger, but safety check here
           return;
       }
       // Delay slightly to prevent infinite loop tightness if something is weird, 
       // but effectively we just want to skip them.
       const timer = setTimeout(() => {
         endTurn();
       }, 500);
       return () => clearTimeout(timer);
    }

    if (currentPlayer.isAi) {
      // AI Turn Logic
      const timer = setTimeout(() => {
        handleAiTurnFlow(currentPlayer.id);
      }, 1500);
      return () => clearTimeout(timer);
    } 
    // Human turn waits for interaction (Roll Dice button)
  }, [activePlayerIndex, gameStarted, players]); // Dependency on players needed to detect bankruptcy state changes

  // --- Setup Games ---

  const startGame = (mode: 'P_VS_AI' | 'P_VS_P' | 'P_VS_P_VS_AI') => {
    const p1: Player = { id: 'P1', name: '我 (🐼)', money: INITIAL_MONEY, position: 0, isJailed: false, isBankrupt: false, properties: [], avatar: '🐼', isAi: false };
    const p2: Player = { id: 'P2', name: '朋友 (🐰)', money: INITIAL_MONEY, position: 0, isJailed: false, isBankrupt: false, properties: [], avatar: '🐰', isAi: false };
    const ai: Player = { id: 'AI', name: '机器人 (🤖)', money: INITIAL_MONEY, position: 0, isJailed: false, isBankrupt: false, properties: [], avatar: '🤖', isAi: true };

    let newPlayers: Player[] = [];
    if (mode === 'P_VS_AI') newPlayers = [p1, ai];
    else if (mode === 'P_VS_P') newPlayers = [p1, p2];
    else if (mode === 'P_VS_P_VS_AI') newPlayers = [p1, p2, ai];

    setPlayers(newPlayers);
    setBoard(GAME_BOARD); // Reset board ownership
    setLogs([]);
    setActivePlayerIndex(0);
    setGameStarted(true);
    addLog("🎮 游戏开始！由你来掌管所有人的财务计算。", "success");
  };

  // --- Helpers ---

  const addLog = (message: string, type: 'info' | 'success' | 'danger' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
  };

  const getPlayerRef = (id: string) => playersRef.current.find(p => p.id === id)!;
  
  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // --- Bankruptcy Logic ---
  
  const triggerBankruptcy = (bankruptPlayerId: string) => {
    const player = getPlayerRef(bankruptPlayerId);
    addLog(`💸 ${player.name} 资金不足，宣告破产！所有资产已被收回。`, "danger");
    
    // 1. Reset board properties owned by this player
    setBoard(prev => prev.map(t => t.owner === bankruptPlayerId ? { ...t, owner: null, level: 1 } : t));
    
    // 2. Mark player as bankrupt and clear their state
    updatePlayer(bankruptPlayerId, { isBankrupt: true, money: 0, properties: [] });

    // 3. Check for Winner
    // We check via ref to get the latest state including the one we just processed conceptually
    // But since updatePlayer is async, we simulate the state check:
    const remainingPlayers = playersRef.current.filter(p => p.id !== bankruptPlayerId && !p.isBankrupt);
    
    if (remainingPlayers.length === 1) {
        setTimeout(() => {
            addLog(`🏆 游戏结束！最终获胜者是 ${remainingPlayers[0].name}！`, "success");
            alert(`游戏结束！${remainingPlayers[0].name} 获胜！`);
            setGameStarted(false);
        }, 1000);
    }
  };

  const deductMoneyOrBankrupt = (playerId: string, amount: number, creditorId?: string) => {
    const player = getPlayerRef(playerId);
    if (player.money < amount) {
        // Not enough money -> Bankrupt
        const remaining = player.money;
        if (creditorId && remaining > 0) {
            const creditor = getPlayerRef(creditorId);
            updatePlayer(creditorId, { money: creditor.money + remaining });
            addLog(`${player.name} 破产前将剩余 ¥${remaining} 抵扣给了 ${creditor.name}。`, "warning");
        }
        triggerBankruptcy(playerId);
    } else {
        updatePlayer(playerId, { money: player.money - amount });
        if (creditorId) {
            const creditor = getPlayerRef(creditorId);
            updatePlayer(creditorId, { money: creditor.money + amount });
        }
    }
  };

  // --- Question Generator Wrapper ---
  // Now accepts a subject name to contextulize the question
  const generateContextualQuestion = (
    subjectName: string,
    description: string, 
    baseVal: number, 
    changeVal: number, 
    operation: 'ADD' | 'SUB' | 'MUL',
    explanation: string
  ): MathQuestion => {
    let answer = 0;
    let questionText = "";

    // If subject is "Me", use direct address, otherwise use Third Person
    const subject = subjectName.includes('我') ? '你' : subjectName;

    if (operation === 'ADD') {
      answer = baseVal + changeVal;
      questionText = `${description}\n\n${subject} 现有: ¥${baseVal}\n收入: ¥${changeVal}\n\n请帮 ${subject} 计算总金额：`;
    } else if (operation === 'SUB') {
      answer = baseVal - changeVal;
      questionText = `${description}\n\n${subject} 现有: ¥${baseVal}\n花费: ¥${changeVal}\n\n请帮 ${subject} 计算剩余金额：`;
    } else if (operation === 'MUL') {
      answer = baseVal * changeVal;
      questionText = `${description}\n\n基础租金: ¥${baseVal}\n倍数: ${changeVal}倍\n\n请帮 ${subject} 计算应付租金：`;
    }

    // Generate distractors
    const options = new Set<number>();
    options.add(answer);
    while (options.size < 4) {
      const diff = Math.random() > 0.5 ? 10 : 100;
      const sign = Math.random() > 0.5 ? 1 : -1;
      const val = answer + (Math.floor(Math.random() * 5) + 1) * diff * sign;
      const valSmall = answer + (Math.floor(Math.random() * 20) - 10);
      
      if (val > 0 && val !== answer) options.add(val);
      else if (valSmall > 0 && valSmall !== answer) options.add(valSmall);
    }

    return {
      question: questionText,
      answer: answer,
      options: Array.from(options).sort(() => Math.random() - 0.5),
      type: operation,
      difficulty: 1,
      explanation: explanation
    };
  };

  // --- Core Game Logic ---

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  // AI Turn Sequence
  const handleAiTurnFlow = async (aiId: string) => {
    const ai = getPlayerRef(aiId);
    
    if (ai.isJailed) {
      addLog(`${ai.name} 在休息站，跳过一回合。`, "warning");
      updatePlayer(aiId, { isJailed: false });
      endTurn();
      return;
    }

    // 1. Visual Rolling State
    setIsRolling(true);
    await new Promise(r => setTimeout(r, 1000)); // AI "thinking/rolling" delay
    
    // 2. Roll Result
    const steps = rollDice();
    setIsRolling(false);
    addLog(`${ai.name} 掷出了 ${steps} 点！`, "info");
    
    // 3. Move
    await movePlayer(aiId, steps);
  };

  // Human Turn Sequence (Button Click)
  const handleHumanTurn = async () => {
    const currentPlayer = players[activePlayerIndex];
    
    if (currentPlayer.isJailed) {
      addLog(`${currentPlayer.name} 在休息站，必须回答问题才能离开！`, "warning");
      triggerMathChallenge(null, () => {
        addLog("✅ 回答正确！解除休息状态。", "success");
        updatePlayer(currentPlayer.id, { isJailed: false });
        // Optional: Let them roll immediately or wait next turn? Let's let them roll immediately for fun.
        const steps = rollDice();
        movePlayer(currentPlayer.id, steps);
      }, () => {
        addLog("❌ 回答错误，下回合继续休息。", "danger");
        endTurn();
      });
      return;
    }

    const steps = rollDice();
    addLog(`${currentPlayer.name} 掷出了 ${steps} 点！`, "info");
    await movePlayer(currentPlayer.id, steps);
  };

  const movePlayer = async (playerId: string, steps: number) => {
    let passedStart = false;

    // Step-by-step animation
    for (let i = 0; i < steps; i++) {
        const currentP = getPlayerRef(playerId);
        let nextPos = currentP.position + 1;
        
        if (nextPos >= BOARD_SIZE) {
            nextPos = 0;
            passedStart = true;
        }

        updatePlayer(playerId, { position: nextPos });
        await new Promise(r => setTimeout(r, 300));
    }
    
    const finalPlayer = getPlayerRef(playerId);
    
    // Pass Start Logic - EVERYONE gets math challenge now
    if (passedStart) {
        const q = generateContextualQuestion(
          finalPlayer.name,
          `${finalPlayer.name} 经过起点，获得工资奖励！`,
          finalPlayer.money,
          200,
          'ADD',
          `${finalPlayer.money} + 200 = ${finalPlayer.money + 200}`
        );
        
        const isUser = playerId === 'P1';

        triggerMathChallenge(q, () => {
          // Success (Both User and AI)
          addLog(`${finalPlayer.name} 领取工资 ¥200`, "success");
          updatePlayer(playerId, { money: finalPlayer.money + 200 }); 
          setTimeout(() => processTile(playerId, finalPlayer.position), 500);
        }, () => {
          // Failure
          if (isUser) {
             addLog("❌ 算错了！银行柜员拒绝发放工资。", "danger");
             // User Penalty: No money
             setTimeout(() => processTile(playerId, finalPlayer.position), 500);
          } else {
             addLog(`❌ 你算错了！但是 ${finalPlayer.name} 自己算对并领了工资。`, "warning");
             addLog("📉 惩罚：你的连胜中断了！", "danger");
             updatePlayer(playerId, { money: finalPlayer.money + 200 });
             setTimeout(() => processTile(playerId, finalPlayer.position), 500);
          }
        });
        return; 
    }

    setTimeout(() => processTile(playerId, finalPlayer.position), 500);
  };

  const processTile = (playerId: string, pos: number) => {
    const tile = board[pos];
    const player = getPlayerRef(playerId);

    addLog(`${player.name} 来到了 ${tile.name}`, "info");

    if (tile.type === TileType.PROPERTY) {
      handlePropertyTile(playerId, tile);
    } else if (tile.type === TileType.CHANCE) {
      handleChanceTile(playerId);
    } else if (tile.type === TileType.BANK) {
      handleBankTile(playerId);
    } else if (tile.type === TileType.JAIL) {
      addLog(`${player.name} 进入休息站，暂停一回合。`, "warning");
      updatePlayer(playerId, { isJailed: true });
      endTurn();
    } else {
      endTurn();
    }
  };

  const handlePropertyTile = (playerId: string, tile: Tile) => {
    const player = getPlayerRef(playerId);
    const isUser = playerId === 'P1';

    // 1. Unowned -> Buy?
    if (tile.owner === null || tile.owner === undefined) {
      if (tile.price && player.money >= tile.price) {
        // AI Logic for decision making (simulate "thinking" but user calculates)
        if (player.isAi && Math.random() < 0.2) {
             addLog(`${player.name} 决定不购买这块地。`, "info");
             endTurn();
             return;
        }

        // EVERYONE gets a math challenge to buy
        const q = generateContextualQuestion(
          player.name,
          `${player.name} 想要购买 ${tile.name}。`,
          player.money,
          tile.price,
          'SUB',
          `${player.money} - ${tile.price} = ${player.money - tile.price}`
        );
        
        triggerMathChallenge(q, () => {
           buyProperty(playerId, tile);
        }, () => {
           if (isUser) {
               addLog("❌ 算错了，交易取消！失去购买机会。", "danger");
               endTurn();
           } else {
               addLog(`❌ 你算错了！${player.name} 自己计算完成了购买。`, "warning");
               addLog("📉 惩罚：你的连胜中断了！", "danger");
               buyProperty(playerId, tile);
           }
        });

      } else {
        addLog(`${player.name} 资金不足，买不起这块地。`, "warning");
        endTurn();
      }
    } 
    // 2. Owned by Self -> Upgrade?
    else if (tile.owner === playerId) {
      const currentLevel = tile.level || 1;
      const upgradeCost = Math.floor((tile.price || 0) * 0.5);

      if (currentLevel < 3) {
        if (player.money >= upgradeCost) {
            // AI Decision
            if (player.isAi && player.money < upgradeCost * 1.5) {
                endTurn(); // AI saves money
                return;
            }
            
            let doUpgrade = true;
            if (!player.isAi) {
                doUpgrade = window.confirm(`🏰 ${tile.name} (Lv${currentLevel})\n升级花费: ¥${upgradeCost}\n是否升级？`);
            }

            if (doUpgrade) {
                const q = generateContextualQuestion(
                    player.name,
                    `${player.name} 升级 ${tile.name}`,
                    player.money,
                    upgradeCost,
                    'SUB',
                    `${player.money} - ${upgradeCost} = ${player.money - upgradeCost}`
                );
                
                triggerMathChallenge(q, () => {
                    upgradeProperty(playerId, tile, upgradeCost);
                }, () => {
                    if (isUser) {
                        addLog("❌ 算错了，升级取消。", "danger");
                        endTurn();
                    } else {
                        addLog(`❌ 你算错了！${player.name} 自己计算并升级了。`, "warning");
                        addLog("📉 惩罚：你的连胜中断了！", "danger");
                        upgradeProperty(playerId, tile, upgradeCost);
                    }
                });
            } else {
                 addLog("保留资金，不升级。", "info");
                 endTurn();
            }
        } else {
             addLog(`资金不足 (需 ¥${upgradeCost})，无法升级。`, "warning");
             endTurn();
        }
      } else {
        addLog(`${tile.name} 已经是顶级了(Lv3)！`, "success");
        endTurn();
      }
    }
    // 3. Owned by Enemy -> Pay Rent
    else {
      const level = tile.level || 1;
      const baseRent = tile.rent || 0;
      const totalRent = baseRent * level;
      const ownerName = players.find(p => p.id === tile.owner)?.name || '未知';
      
      const payFlow = () => {
           let q: MathQuestion;
           // If high level, ask multiplication first?
           if (level > 1 && Math.random() > 0.5) {
              q = generateContextualQuestion(
                 player.name,
                 `${player.name} 需支付租金给 ${ownerName}。\n基础租金 ¥${baseRent}，等级 ${level}级。`,
                 baseRent,
                 level,
                 'MUL',
                 `${baseRent} x ${level} = ${totalRent}`
              );
           } else {
              q = generateContextualQuestion(
                 player.name,
                 `${player.name} 需支付租金 ¥${totalRent} 给 ${ownerName}。`,
                 player.money,
                 totalRent,
                 'SUB',
                 `${player.money} - ${totalRent} = ${player.money - totalRent}`
              );
           }

           triggerMathChallenge(q, () => {
               deductMoneyOrBankrupt(playerId, totalRent, tile.owner!);
               endTurn();
           }, () => {
               if (isUser) {
                   // For rent (negative thing), if user fails, we force retry
                   addLog("❌ 必须算对才能继续！再试一次。", "danger");
                   setTimeout(payFlow, 1000); 
               } else {
                   // For AI/P2, if User fails to help, AI pays anyway.
                   addLog(`❌ 你算错了！${player.name} 自己支付了租金。`, "warning");
                   addLog("📉 惩罚：你的连胜中断了！", "danger");
                   deductMoneyOrBankrupt(playerId, totalRent, tile.owner!);
                   endTurn();
               }
           });
      };
      
      payFlow();
    }
  };

  const buyProperty = (playerId: string, tile: Tile) => {
    const player = getPlayerRef(playerId);
    if (!tile.price) return;
    
    // Check bankrupt safety though usually checked before
    if (player.money < tile.price) return;

    updatePlayer(playerId, { 
      money: player.money - tile.price,
      properties: [...player.properties, tile.id]
    });
    
    setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, owner: playerId } : t));
    addLog(`${player.name} 花费 ¥${tile.price} 购买了 ${tile.name}！`, "success");
    endTurn();
  };

  const upgradeProperty = (playerId: string, tile: Tile, cost: number) => {
    const player = getPlayerRef(playerId);
    if (player.money < cost) return;

    updatePlayer(playerId, { money: player.money - cost });
    
    const newLevel = (tile.level || 1) + 1;
    setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, level: newLevel } : t));
    
    setUpgradingTileId(tile.id);
    setTimeout(() => setUpgradingTileId(null), 2500);

    addLog(`${player.name} 花费 ¥${cost} 升级了 ${tile.name} (Lv${newLevel})！`, "success");
    endTurn();
  };

  const handleChanceTile = (playerId: string) => {
    const player = getPlayerRef(playerId);
    const isUser = playerId === 'P1';
    
    const events = [
      { text: "捡到了钱包！", amount: 100 },
      { text: "请客吃小笼包。", amount: -50 },
      { text: "中了大奖！", amount: 200 },
      { text: "买书学习。", amount: -30 },
    ];
    const evt = events[Math.floor(Math.random() * events.length)];
    const isGood = evt.amount > 0;
    
    const op = isGood ? 'ADD' : 'SUB';
    const absAmount = Math.abs(evt.amount);
    
    const q = generateContextualQuestion(
        player.name,
        `运气卡：${player.name} ${evt.text}`,
        player.money,
        absAmount,
        op,
        op === 'ADD' ? `${player.money} + ${absAmount} = ${player.money + absAmount}` : `${player.money} - ${absAmount} = ${player.money - absAmount}`
    );
    
    triggerMathChallenge(q, () => {
        if (isGood) {
            updatePlayer(playerId, { money: player.money + evt.amount });
        } else {
            deductMoneyOrBankrupt(playerId, absAmount);
        }
        if (!getPlayerRef(playerId).isBankrupt) { // Only log success if not bankrupt during deduction
             addLog(`${evt.text} (¥${evt.amount})`, isGood ? "success" : "warning");
        }
        endTurn();
    }, () => {
         // Failure Logic
         if (isUser) {
             if (isGood) {
                 addLog("❌ 算错了，奖金飞走了！(机会取消)", "danger");
                 endTurn();
             } else {
                 addLog("❌ 算错了，还是要扣钱！", "danger");
                 deductMoneyOrBankrupt(playerId, absAmount);
                 endTurn();
             }
         } else {
             // For Opponent
             addLog(`❌ 你算错了！${player.name} 自己处理了。`, "warning");
             addLog("📉 惩罚：你的连胜中断了！", "danger");
             if (isGood) {
                 updatePlayer(playerId, { money: player.money + evt.amount });
             } else {
                 deductMoneyOrBankrupt(playerId, absAmount);
             }
             endTurn();
         }
    });
  };

  const handleBankTile = (playerId: string) => {
    const player = getPlayerRef(playerId);
    const isUser = playerId === 'P1';
    let amount = 0;
    let text = "";
    
    if (player.position === 6) { // People's Bank
       amount = 150;
       text = "银行理财收益";
    } else if (player.position === 14) { // Tax Bureau
       amount = -100;
       text = "缴纳税款";
    }

    const isGood = amount > 0;
    const op = isGood ? 'ADD' : 'SUB';
    const absAmount = Math.abs(amount);
    
    const q = generateContextualQuestion(
        player.name,
        `${player.name} ${text}`,
        player.money,
        absAmount,
        op,
        op === 'ADD' ? `${player.money} + ${absAmount} = ${player.money + absAmount}` : `${player.money} - ${absAmount} = ${player.money - absAmount}`
    );
    
    triggerMathChallenge(q, () => {
         if (isGood) {
             updatePlayer(playerId, { money: player.money + amount });
         } else {
             deductMoneyOrBankrupt(playerId, absAmount);
         }
         
         if (!getPlayerRef(playerId).isBankrupt) {
             addLog(`${text} ¥${amount}`, isGood ? "success" : "warning");
         }
         endTurn();
     }, () => {
         if (isUser) {
             if (isGood) {
                 addLog("❌ 算错了，收益被取消。", "danger");
                 endTurn();
             } else {
                 addLog("❌ 算错了，税还是要交的。", "danger");
                 deductMoneyOrBankrupt(playerId, absAmount);
                 endTurn();
             }
         } else {
             addLog(`❌ 你算错了！${player.name} 自己处理了。`, "warning");
             addLog("📉 惩罚：你的连胜中断了！", "danger");
             if (isGood) {
                 updatePlayer(playerId, { money: player.money + amount });
             } else {
                 deductMoneyOrBankrupt(playerId, absAmount);
             }
             endTurn();
         }
     });
  };

  const endTurn = () => {
    // Determine next player
    // Note: We use the callback to ensure we get the latest state for index calc if called rapidly, 
    // though activePlayerIndex updates are usually discrete.
    // However, since we might need to skip bankrupt players, we loop.
    
    setActivePlayerIndex(prev => {
        let nextIndex = (prev + 1) % players.length;
        let attempts = 0;
        // Loop until we find a non-bankrupt player
        while (players[nextIndex].isBankrupt && attempts < players.length) {
            nextIndex = (nextIndex + 1) % players.length;
            attempts++;
        }
        return nextIndex;
    });
  };

  // --- Math Interaction ---

  const triggerMathChallenge = async (
      forcedQuestion: MathQuestion | null, 
      onSuccess: () => void, 
      onFailure: () => void
  ) => {
    setIsQuestionLoading(true);
    setShowMathModal(true);
    
    let question = forcedQuestion;
    if (!question) {
        question = await generateMathQuestion(mistakes);
    }
    
    setCurrentQuestion(question);
    setIsQuestionLoading(false);

    setPendingAction(() => {
      return (isCorrect: boolean) => {
        if (isCorrect) {
          setStreak(s => s + 1);
          onSuccess();
        } else {
          setStreak(0); // Reset streak regardless of who is playing
          if (question) {
             setMistakes(prev => {
                const existing = prev.find(m => m.questionType === question!.type);
                if (existing) {
                    return prev.map(m => m.questionType === question!.type ? { ...m, count: m.count + 1, timestamp: Date.now() } : m);
                }
                return [...prev, { questionType: question!.type, count: 1, timestamp: Date.now() }];
             });
          }
          onFailure();
        }
        setShowMathModal(false);
        setCurrentQuestion(null);
      };
    });
  };

  const handleMathAnswer = (isCorrect: boolean) => {
    if (pendingAction) {
      pendingAction(isCorrect);
    }
  };

  // --- Render ---

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-white/50">
          <div className="text-6xl mb-6 animate-bounce">🐼 🐰 🤖</div>
          <h1 className="text-4xl font-extrabold text-blue-600 mb-2">数学大富翁</h1>
          <p className="text-gray-500 mb-8 font-medium">上海大冒险 - 三年级版</p>
          
          <div className="space-y-3 mb-8">
            <button 
              onClick={() => startGame('P_VS_AI')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center"
            >
              <Bot className="w-6 h-6 mr-2" /> 单人挑战 AI
            </button>
            <button 
              onClick={() => startGame('P_VS_P')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center"
            >
              <Users className="w-6 h-6 mr-2" /> 双人对战 (无AI)
            </button>
            <button 
              onClick={() => startGame('P_VS_P_VS_AI')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center"
            >
              <UserPlus className="w-6 h-6 mr-2" /> 双人挑战 AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players[activePlayerIndex];
  // Helper to get specific players for UI
  const p1 = players.find(p => p.id === 'P1');
  const p2 = players.find(p => p.id === 'P2');
  const ai = players.find(p => p.id === 'AI');

  return (
    <div className="min-h-screen bg-sky-100 p-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Player Stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* P1 Card */}
          {p1 && (
            <div className={`bg-white rounded-2xl p-4 shadow-lg border-l-8 transition-all ${p1.isBankrupt ? 'grayscale opacity-60 border-gray-400' : (activePlayerIndex === players.indexOf(p1) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200')}`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-3xl bg-blue-100 p-1 rounded-full">{p1.avatar}</div>
                <div>
                  <h2 className="font-bold flex items-center">
                    {p1.name}
                    {p1.isBankrupt && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">破产</span>}
                  </h2>
                  <div className="flex items-center text-yellow-600 font-mono font-bold">
                    <Coins className="w-4 h-4 mr-1" /> {p1.money}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                 {badges.filter(b => b.unlocked).map(b => (
                   <span key={b.id} title={b.name} className="text-xl">{b.icon}</span>
                 ))}
              </div>
            </div>
          )}

          {/* P2 Card */}
          {p2 && (
            <div className={`bg-white rounded-2xl p-4 shadow-lg border-l-8 transition-all ${p2.isBankrupt ? 'grayscale opacity-60 border-gray-400' : (activePlayerIndex === players.indexOf(p2) ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200')}`}>
              <div className="flex items-center space-x-3">
                <div className="text-3xl bg-green-100 p-1 rounded-full">{p2.avatar}</div>
                <div>
                  <h2 className="font-bold flex items-center">
                     {p2.name}
                     {p2.isBankrupt && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">破产</span>}
                  </h2>
                  <div className="flex items-center text-yellow-600 font-mono font-bold">
                    <Coins className="w-4 h-4 mr-1" /> {p2.money}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Card */}
          {ai && (
            <div className={`bg-white rounded-2xl p-4 shadow-lg border-l-8 transition-all ${ai.isBankrupt ? 'grayscale opacity-60 border-gray-400' : (activePlayerIndex === players.indexOf(ai) ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200')} opacity-90`}>
               <div className="flex items-center space-x-3">
                <div className="text-3xl bg-gray-100 p-1 rounded-full">{ai.avatar}</div>
                <div>
                  <h2 className="font-bold text-gray-700 flex items-center">
                    {ai.name}
                    {ai.isBankrupt && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">破产</span>}
                  </h2>
                  <div className="flex items-center text-gray-600 font-mono text-sm">
                    <Coins className="w-4 h-4 mr-1" /> {ai.money}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mistake Stats */}
          {mistakes.length > 0 && (
             <div className="bg-orange-50 rounded-2xl p-4 shadow-sm border border-orange-200">
                <h3 className="text-orange-800 font-bold text-sm flex items-center mb-2">
                   <AlertTriangle className="w-4 h-4 mr-1"/> 学习重点
                </h3>
                <div className="flex flex-wrap gap-2">
                   {mistakes.sort((a,b) => b.count - a.count).slice(0, 3).map((m, i) => (
                      <span key={i} className="text-xs bg-white text-orange-600 px-2 py-1 rounded border border-orange-100">
                        {m.questionType === 'MUL' ? '乘法' : m.questionType === 'DIV' ? '除法' : m.questionType === 'ADD' ? '加法' : '减法'}
                        <span className="ml-1 font-bold">x{m.count}</span>
                      </span>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Center: Game Board */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <GameBoard 
            tiles={board} 
            players={players} 
            currentPlayerId={currentPlayer.id} 
            upgradingTileId={upgradingTileId}
            onRollDice={handleHumanTurn}
            isAiRolling={isRolling && currentPlayer.isAi}
          />
        </div>

        {/* Right Panel: Logs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-96 flex flex-col">
            <div className="bg-gray-50 p-3 border-b border-gray-200 font-bold text-gray-600 flex items-center">
              <History className="w-4 h-4 mr-2" /> 游戏记录
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded-lg border-l-4 animate-fadeIn
                    ${log.type === 'info' ? 'bg-gray-50 border-gray-300 text-gray-700' : ''}
                    ${log.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : ''}
                    ${log.type === 'danger' ? 'bg-red-50 border-red-400 text-red-800' : ''}
                    ${log.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : ''}
                  `}
                >
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showMathModal && (
        <MathChallenge 
          question={currentQuestion} 
          isLoading={isQuestionLoading}
          onAnswer={handleMathAnswer} 
        />
      )}
    </div>
  );
};

export default App;