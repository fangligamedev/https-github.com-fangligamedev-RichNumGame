import React, { useState, useEffect, useRef } from 'react';
import GameBoard from './components/GameBoard';
import MathChallenge from './components/MathChallenge';
import { Player, Tile, TileType, MathQuestion, GameLog, MistakeRecord, Badge, VisualEffect, WrongAnswerLog } from './types';
import { GAME_BOARD, INITIAL_MONEY, INITIAL_BADGES, BOARD_SIZE } from './constants';
import { generateMathQuestion } from './services/geminiService';
import { Coins, History, AlertTriangle, Users, Bot, UserPlus, BookOpen, X, CheckCircle2, XCircle, Volume2, VolumeX, Settings, PlayCircle } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0); // Use index to track turn
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [board, setBoard] = useState<Tile[]>(GAME_BOARD);
  const [logs, setLogs] = useState<GameLog[]>([]);
  
  // Audio State
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Voice Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceConfig, setVoiceConfig] = useState({
    voiceName: '', // Selected voice name
    pitch: 1.0,
    rate: 1.0
  });

  // Animation State
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [upgradingTileId, setUpgradingTileId] = useState<number | null>(null);
  
  // 3D Dice State
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [pendingDiceStep, setPendingDiceStep] = useState<number | null>(null);
  
  // Math Challenge State
  const [showMathModal, setShowMathModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  // Updated pendingAction signature to accept selectedOption
  const [pendingAction, setPendingAction] = useState<((isCorrect: boolean, selectedOption?: number) => void) | null>(null);
  
  // Stats & Review
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerLog[]>([]); // Store detailed wrong answers
  const [showMistakeModal, setShowMistakeModal] = useState(false); // UI state for review modal

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef(players); // Keep track of latest players state
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Audio Helpers ---
  
  // Initialize Audio Context
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Load Voices Logic
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Filter for Chinese voices, or all if none found (fallback)
      const zhVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
      
      const uniqueVoices = zhVoices.length > 0 ? zhVoices : voices;
      setAvailableVoices(uniqueVoices);

      // Set default if not set
      setVoiceConfig(prev => {
        if (prev.voiceName) return prev; // Already set
        
        // Prioritize Ting-Ting specifically as per user request
        const preferred = uniqueVoices.find(v => v.name.includes('Ting-Ting') || v.name.includes('婷婷')) 
                       || uniqueVoices.find(v => v.name.includes('Google') || v.name.includes('Yaoyao'));
        
        return {
          ...prev,
          voiceName: preferred ? preferred.name : (uniqueVoices[0]?.name || '')
        };
      });
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Play synthetic sound effects (Beeps/Boops)
  const playSound = (type: 'success' | 'error' | 'click' | 'turn' | 'coin' | 'dice') => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'success') {
      // Game Effect: Major Chord Arpeggio (C5 - E5 - G5 - C6)
      const frequencies = [523.25, 659.25, 783.99, 1046.50];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; // Smooth tone
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });

    } else if (type === 'error') {
      // Game Effect: Cartoon "Fail" slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth'; // Buzzer like
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4); // Slide down pitch

      gain.gain.setValueAtTime(0.15, now); // Slightly lower volume
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);

    } else if (type === 'coin') {
      // High ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);

    } else if (type === 'turn') {
      // Gentle pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);

    } else if (type === 'dice') {
      // Fun "Zip/Whir" sound for rolling
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2); // Pitch slide up
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'click') {
        // Very short blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    }
  };

  // Text to Speech - Uses User Settings
  const speak = (text: string, force = false) => {
    if (!soundEnabled && !force) return;
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Use User Settings
    const selectedVoice = availableVoices.find(v => v.name === voiceConfig.voiceName);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else if (availableVoices.length > 0) {
        utterance.voice = availableVoices[0]; // Fallback
    }
    
    utterance.lang = 'zh-CN'; 
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;

    window.speechSynthesis.speak(utterance);
  };

  const testVoice = () => {
    speak("你好，我是您的数学小助手。今天我们要一起去上海探险！", true);
  };

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
      playSound('success');
    }
    if (!newBadges[1].unlocked && streak >= 5) {
      newBadges[1].unlocked = true;
      addLog("🏅 解锁成就：速算小能手！", "success");
      badgeChanged = true;
      playSound('success');
    }
    if (!newBadges[2].unlocked && p1.money >= 5000) {
      newBadges[2].unlocked = true;
      addLog("🏅 P1 解锁成就：上海首富！", "success");
      badgeChanged = true;
      playSound('success');
    }

    if (badgeChanged) setBadges(newBadges);
  }, [players, streak]);

  // Turn Orchestration
  useEffect(() => {
    if (!gameStarted) return;
    if (playersRef.current.length === 0) return;

    const currentPlayer = playersRef.current[activePlayerIndex];
    if (!currentPlayer) return;

    // Check for Bankruptcy / Skip Turn
    if (currentPlayer.isBankrupt) {
       // If current player is bankrupt, immediately move to next
       const activePlayers = playersRef.current.filter(p => !p.isBankrupt);
       if (activePlayers.length <= 1) {
           return;
       }
       
       const timer = setTimeout(() => {
         endTurn();
       }, 500);
       return () => clearTimeout(timer);
    }

    // AI Turn Trigger
    if (currentPlayer.isAi && !showMistakeModal && !showMathModal && !showSettings && pendingDiceStep === null && !isDiceRolling) {
      const timer = setTimeout(() => {
        handleAiTurnFlow(currentPlayer.id);
      }, 1500);
      return () => clearTimeout(timer);
    } 
  }, [activePlayerIndex, gameStarted, showMistakeModal, showMathModal, showSettings, pendingDiceStep, isDiceRolling]); 

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
    setBoard(GAME_BOARD); 
    setLogs([]);
    setActivePlayerIndex(0);
    setGameStarted(true);
    setDiceValue(null);
    setPendingDiceStep(null);
    
    initAudio(); 
    addLog("🎮 游戏开始！由你来掌管所有人的财务计算。", "success");
    playSound('success');
  };

  // --- Helpers ---

  const addLog = (message: string, type: 'info' | 'success' | 'danger' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
    speak(message);
  };

  const getPlayerRef = (id: string) => playersRef.current.find(p => p.id === id)!;
  
  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addVisualEffect = (position: number, text: string, type: VisualEffect['type']) => {
    const id = Date.now() + Math.random();
    setVisualEffects(prev => [...prev, { id, position, text, type }]);
    setTimeout(() => {
      setVisualEffects(prev => prev.filter(e => e.id !== id));
    }, 2000);
    
    if (type === 'money-gain') playSound('coin');
    if (type === 'money-loss') playSound('click');
    if (type === 'upgrade') playSound('success');
    if (type === 'buy') playSound('coin');
  };

  // --- Bankruptcy Logic ---
  
  const triggerBankruptcy = (bankruptPlayerId: string) => {
    const player = getPlayerRef(bankruptPlayerId);
    addLog(`💸 ${player.name} 资金不足，宣告破产！所有资产已被收回。`, "danger");
    addVisualEffect(player.position, "破产!", "bankrupt");
    playSound('error');
    
    setBoard(prev => prev.map(t => t.owner === bankruptPlayerId ? { ...t, owner: null, level: 1 } : t));
    updatePlayer(bankruptPlayerId, { isBankrupt: true, money: 0, properties: [] });

    const remainingPlayers = playersRef.current.filter(p => p.id !== bankruptPlayerId && !p.isBankrupt);
    
    if (remainingPlayers.length === 1) {
        setTimeout(() => {
            addLog(`🏆 游戏结束！最终获胜者是 ${remainingPlayers[0].name}！`, "success");
            playSound('success');
            alert(`游戏结束！${remainingPlayers[0].name} 获胜！`);
            setGameStarted(false);
        }, 1000);
    }
  };

  const deductMoneyOrBankrupt = (playerId: string, amount: number, creditorId?: string) => {
    const player = getPlayerRef(playerId);
    if (player.money < amount) {
        const remaining = player.money;
        if (creditorId && remaining > 0) {
            const creditor = getPlayerRef(creditorId);
            updatePlayer(creditorId, { money: creditor.money + remaining });
            addVisualEffect(creditor.position, `+${remaining}`, "money-gain");
            addLog(`${player.name} 破产前将剩余 ¥${remaining} 抵扣给了 ${creditor.name}。`, "warning");
        }
        triggerBankruptcy(playerId);
    } else {
        updatePlayer(playerId, { money: player.money - amount });
        addVisualEffect(player.position, `-${amount}`, "money-loss");
        
        if (creditorId) {
            const creditor = getPlayerRef(creditorId);
            updatePlayer(creditorId, { money: creditor.money + amount });
            if (creditor.position >= 0) {
                 addVisualEffect(creditor.position, `+${amount}`, "money-gain");
            }
        }
    }
  };

  // --- Question Generator Wrapper ---
  // Now accepts 'DIV' operation
  const generateContextualQuestion = (
    subjectName: string,
    description: string, 
    baseVal: number, 
    changeVal: number, 
    operation: 'ADD' | 'SUB' | 'MUL' | 'DIV',
    explanation: string
  ): MathQuestion => {
    let answer = 0;
    let questionText = "";

    const subject = subjectName.includes('我') ? '你' : subjectName;

    if (operation === 'ADD') {
      answer = baseVal + changeVal;
      questionText = `${description}\n\n${subject} 现有: ¥${baseVal}\n收入: ¥${changeVal}\n\n请帮 ${subject} 计算总金额：`;
    } else if (operation === 'SUB') {
      answer = baseVal - changeVal;
      questionText = `${description}\n\n${subject} 现有: ¥${baseVal}\n花费: ¥${changeVal}\n\n请帮 ${subject} 计算剩余金额：`;
    } else if (operation === 'MUL') {
      answer = baseVal * changeVal;
      questionText = `${description}\n\n数量: ${changeVal}\n单价/基数: ¥${baseVal}\n\n请帮 ${subject} 计算总数：`;
    } else if (operation === 'DIV') {
      // For division, baseVal is usually the Total, changeVal is the divisor (groups)
      answer = Math.floor(baseVal / changeVal);
      questionText = `${description}\n\n总金额/总量: ¥${baseVal}\n分配份数: ${changeVal}\n\n请帮 ${subject} 计算每份是多少：`;
    }

    // Generate distractors
    const options = new Set<number>();
    options.add(answer);
    while (options.size < 4) {
      const diff = Math.random() > 0.5 ? 10 : 2;
      const sign = Math.random() > 0.5 ? 1 : -1;
      
      // Smart distractors based on type
      let val = 0;
      if (operation === 'MUL' || operation === 'DIV') {
          val = answer + (Math.floor(Math.random() * 5) + 1) * sign; // Close numbers
      } else {
          val = answer + (Math.floor(Math.random() * 5) + 1) * 10 * sign; // Close tens
      }
      
      if (val > 0 && val !== answer) options.add(val);
    }

    return {
      question: questionText,
      answer: answer,
      options: Array.from(options).sort(() => Math.random() - 0.5),
      type: operation,
      difficulty: (operation === 'MUL' || operation === 'DIV') ? 2 : 1,
      explanation: explanation
    };
  };

  // --- Core Game Logic ---

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  // AI Turn Sequence
  const handleAiTurnFlow = async (aiId: string) => {
    const ai = getPlayerRef(aiId);
    
    if (ai.isJailed) {
      addLog(`${ai.name} 在休息站，必须回答数学题才能离开！`, "warning");
      
      // AI "attempts" to answer
      const q = generateContextualQuestion(
          ai.name,
          `${ai.name} 想要离开休息站，必须把 120 分钟休息时间平均分成 4 段。`,
          120,
          4,
          'DIV',
          `120 ÷ 4 = 30`
      );

      triggerMathChallenge(q, () => {
         addLog(`✅ ${ai.name} 算对了！解除休息状态。`, "success");
         updatePlayer(aiId, { isJailed: false });
         setTimeout(triggerDiceRoll, 500);
      }, () => {
         addLog(`❌ ${ai.name} 也没算出来，下回合继续休息。`, "danger");
         endTurn();
      });
      return;
    }

    triggerDiceRoll();
  };

  // Human Turn Sequence (Button Click)
  const handleHumanTurn = async () => {
    const currentPlayer = players[activePlayerIndex];
    initAudio(); 

    if (currentPlayer.isJailed) {
      addLog(`${currentPlayer.name} 在休息站，必须做对除法题才能离开！`, "warning");
      
      // Jail Question is now Division
      const q = generateContextualQuestion(
          currentPlayer.name,
          "管理员：想要离开，请把 240 元罚款平均分成 6 份缴纳。",
          240,
          6,
          'DIV',
          `240 ÷ 6 = 40`
      );

      triggerMathChallenge(q, () => {
        addLog("✅ 回答正确！解除休息状态。", "success");
        updatePlayer(currentPlayer.id, { isJailed: false });
        triggerDiceRoll();
      }, () => {
        addLog("❌ 回答错误，下回合继续休息。", "danger");
        endTurn();
      });
      return;
    }

    triggerDiceRoll();
  };

  const triggerDiceRoll = () => {
    playSound('dice'); 
    const steps = rollDice();
    setDiceValue(steps);
    setPendingDiceStep(steps);
    setIsDiceRolling(true);
  };

  const onDiceAnimationComplete = () => {
    setIsDiceRolling(false);
    if (pendingDiceStep !== null) {
      const currentPlayer = getPlayerRef(playersRef.current[activePlayerIndex].id);
      addLog(`${currentPlayer.name} 掷出了 ${pendingDiceStep} 点！`, "info");
      
      setTimeout(() => {
          movePlayer(currentPlayer.id, pendingDiceStep);
      }, 500);
    }
  };

  const movePlayer = async (playerId: string, steps: number) => {
    let passedStart = false;

    for (let i = 0; i < steps; i++) {
        const currentP = getPlayerRef(playerId);
        let nextPos = currentP.position + 1;
        
        if (nextPos >= BOARD_SIZE) {
            nextPos = 0;
            passedStart = true;
        }

        updatePlayer(playerId, { position: nextPos });
        playSound('click'); 
        await new Promise(r => setTimeout(r, 300));
    }
    
    const finalPlayer = getPlayerRef(playerId);
    
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
          addLog(`${finalPlayer.name} 领取工资 ¥200`, "success");
          updatePlayer(playerId, { money: finalPlayer.money + 200 });
          addVisualEffect(0, "+200", "money-gain"); 
          setTimeout(() => processTile(playerId, finalPlayer.position), 500);
        }, () => {
          if (isUser) {
             addLog("❌ 算错了！银行柜员拒绝发放工资。", "danger");
             setTimeout(() => processTile(playerId, finalPlayer.position), 500);
          } else {
             addLog(`❌ 你算错了！但是 ${finalPlayer.name} 自己算对并领了工资。`, "warning");
             addLog("📉 惩罚：你的连胜中断了！", "danger");
             updatePlayer(playerId, { money: finalPlayer.money + 200 });
             addVisualEffect(0, "+200", "money-gain");
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
        if (player.isAi) {
             // AI Logic
        }

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
            if (player.isAi && player.money < upgradeCost + 100) {
                addLog(`${player.name} 决定保留资金，暂不升级。`, "info");
                endTurn(); 
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
           if (level > 1) {
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
                   addLog("❌ 必须算对才能继续！再试一次。", "danger");
                   setTimeout(payFlow, 1000); 
               } else {
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
    if (player.money < tile.price) return;

    updatePlayer(playerId, { 
      money: player.money - tile.price,
      properties: [...player.properties, tile.id]
    });
    addVisualEffect(tile.id, `-${tile.price}`, "money-loss");
    addVisualEffect(tile.id, "购买!", "buy");
    
    setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, owner: playerId } : t));
    addLog(`${player.name} 花费 ¥${tile.price} 购买了 ${tile.name}！`, "success");
    endTurn();
  };

  const upgradeProperty = (playerId: string, tile: Tile, cost: number) => {
    const player = getPlayerRef(playerId);
    if (player.money < cost) return;

    updatePlayer(playerId, { money: player.money - cost });
    addVisualEffect(tile.id, `-${cost}`, "money-loss");
    addVisualEffect(tile.id, "升级!", "upgrade");
    
    const newLevel = (tile.level || 1) + 1;
    setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, level: newLevel } : t));
    
    setUpgradingTileId(tile.id);
    setTimeout(() => setUpgradingTileId(null), 2500);

    addLog(`${player.name} 花费 ¥${cost} 升级了 ${tile.name} (Lv${newLevel})！`, "success");
    endTurn();
  };

  // UPDATED: Handle Chance Tile with more MUL/DIV
  const handleChanceTile = (playerId: string) => {
    const player = getPlayerRef(playerId);
    const isUser = playerId === 'P1';
    
    // Scenarios including ADD, SUB, MUL, DIV
    const events = [
      { text: "捡到了钱包！", type: 'ADD', val1: player.money, val2: 100, isGain: true, desc: "收入" },
      { text: "卖掉旧书 (5本 x ¥20)", type: 'MUL', val1: 20, val2: 5, isGain: true, desc: "收入" }, // 100
      { text: "帮邻居遛狗 (3天 x ¥50)", type: 'MUL', val1: 50, val2: 3, isGain: true, desc: "收入" }, // 150
      { text: "平分奖金 ¥200 给4个朋友", type: 'DIV', val1: 200, val2: 4, isGain: true, desc: "每人分得" }, // 50 (Gain for player context? Let's say player gets one share)
      { text: "请客吃冰淇淋 (4个 x ¥15)", type: 'MUL', val1: 15, val2: 4, isGain: false, desc: "支付" }, // 60
      { text: "不小心打碎花瓶", type: 'SUB', val1: player.money, val2: 80, isGain: false, desc: "赔偿" },
    ];

    const evt = events[Math.floor(Math.random() * events.length)];
    let calculatedAmount = 0;
    let op = evt.type as 'ADD' | 'SUB' | 'MUL' | 'DIV';
    let q: MathQuestion;

    if (evt.type === 'MUL') {
        calculatedAmount = evt.val1 * evt.val2;
        q = generateContextualQuestion(player.name, `运气卡：${evt.text}`, evt.val1, evt.val2, 'MUL', `${evt.val1} x ${evt.val2} = ${calculatedAmount}`);
    } else if (evt.type === 'DIV') {
        calculatedAmount = Math.floor(evt.val1 / evt.val2);
        q = generateContextualQuestion(player.name, `运气卡：${evt.text}`, evt.val1, evt.val2, 'DIV', `${evt.val1} ÷ ${evt.val2} = ${calculatedAmount}`);
    } else {
        // Standard ADD/SUB
        calculatedAmount = evt.val2;
        op = evt.isGain ? 'ADD' : 'SUB';
        q = generateContextualQuestion(
            player.name, 
            `运气卡：${evt.text}`, 
            player.money, 
            calculatedAmount, 
            op, 
            op === 'ADD' ? `${player.money} + ${calculatedAmount} = ${player.money + calculatedAmount}` : `${player.money} - ${calculatedAmount} = ${player.money - calculatedAmount}`
        );
    }
    
    triggerMathChallenge(q, () => {
        if (evt.isGain) {
            updatePlayer(playerId, { money: player.money + calculatedAmount });
            addVisualEffect(player.position, `+${calculatedAmount}`, "money-gain");
        } else {
            deductMoneyOrBankrupt(playerId, calculatedAmount);
        }
        if (!getPlayerRef(playerId).isBankrupt) {
             addLog(`${evt.text} (¥${calculatedAmount})`, evt.isGain ? "success" : "warning");
        }
        endTurn();
    }, () => {
         // Failure Logic
         if (isUser) {
             if (evt.isGain) {
                 addLog("❌ 算错了，奖励飞走了！", "danger");
                 endTurn();
             } else {
                 addLog("❌ 算错了，还是要扣钱！", "danger");
                 deductMoneyOrBankrupt(playerId, calculatedAmount);
                 endTurn();
             }
         } else {
             addLog(`❌ 你算错了！${player.name} 自己处理了。`, "warning");
             addLog("📉 惩罚：你的连胜中断了！", "danger");
             if (evt.isGain) {
                 updatePlayer(playerId, { money: player.money + calculatedAmount });
                 addVisualEffect(player.position, `+${calculatedAmount}`, "money-gain");
             } else {
                 deductMoneyOrBankrupt(playerId, calculatedAmount);
             }
             endTurn();
         }
    });
  };

  // UPDATED: Handle Bank Tile with specific logic
  const handleBankTile = (playerId: string) => {
    const player = getPlayerRef(playerId);
    const isUser = playerId === 'P1';
    let amount = 0;
    let text = "";
    let q: MathQuestion;
    
    // Tax Bureau (Tile 24) -> Pay Tax based on Property Count (MUL)
    if (player.position === 24) { 
       const propertyCount = player.properties.length;
       const taxPerProperty = 50;
       
       if (propertyCount > 0) {
           amount = propertyCount * taxPerProperty; // Negative handled in logic
           text = `缴纳房产税 (拥有${propertyCount}处 x ¥${taxPerProperty})`;
           q = generateContextualQuestion(player.name, text, taxPerProperty, propertyCount, 'MUL', `${taxPerProperty} x ${propertyCount} = ${amount}`);
       } else {
           amount = 50;
           text = "缴纳低保税 (无房产)";
           q = generateContextualQuestion(player.name, text, player.money, amount, 'SUB', `${player.money} - ${amount} = ${player.money - amount}`);
       }
       
       // Bank Logic Wrapper
       triggerMathChallenge(q, () => {
            deductMoneyOrBankrupt(playerId, amount);
            addLog(`${text} (-¥${amount})`, "warning");
            endTurn();
       }, () => {
            // Fail
             if (isUser) {
                 addLog("❌ 算错了，税还是要交的。", "danger");
                 deductMoneyOrBankrupt(playerId, amount);
             } else {
                 addLog(`❌ 你算错了！${player.name} 自动交税了。`, "warning");
                 deductMoneyOrBankrupt(playerId, amount);
             }
             endTurn();
       });

    } else if (player.position === 12) { 
       // People's Bank (Tile 12) -> Interest (MUL)
       // Logic: Interest = 3 months * 50
       const months = 3;
       const rate = 50;
       amount = months * rate;
       text = `银行利息收益 (${months}个月 x ¥${rate})`;
       
       q = generateContextualQuestion(player.name, text, rate, months, 'MUL', `${rate} x ${months} = ${amount}`);
       
       triggerMathChallenge(q, () => {
             updatePlayer(playerId, { money: player.money + amount });
             addVisualEffect(player.position, `+${amount}`, "money-gain");
             addLog(`${text}`, "success");
             endTurn();
       }, () => {
             if (isUser) {
                 addLog("❌ 算错了，利息被没收。", "danger");
             } else {
                 addLog(`❌ 你算错了！${player.name} 领走了利息。`, "warning");
                 updatePlayer(playerId, { money: player.money + amount });
             }
             endTurn();
       });
    } else {
        // Fallback
        endTurn();
    }
  };

  const endTurn = () => {
    // Determine next player
    setDiceValue(null);
    setPendingDiceStep(null);
    setIsDiceRolling(false);
    
    setActivePlayerIndex(prev => {
        let nextIndex = (prev + 1) % playersRef.current.length;
        let attempts = 0;
        // Loop until we find a non-bankrupt player
        while (playersRef.current[nextIndex].isBankrupt && attempts < playersRef.current.length) {
            nextIndex = (nextIndex + 1) % playersRef.current.length;
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
    playSound('turn'); // Notification sound
    
    let question = forcedQuestion;
    if (!question) {
        question = await generateMathQuestion(mistakes);
    }
    
    setCurrentQuestion(question);
    setIsQuestionLoading(false);

    setPendingAction(() => {
      // Return a closure that accepts outcome AND selected option
      return (isCorrect: boolean, selectedOption?: number) => {
        if (isCorrect) {
          setStreak(s => s + 1);
          playSound('success'); // Correct sound
          onSuccess();
        } else {
          setStreak(0); // Reset streak regardless of who is playing
          playSound('error'); // Error sound
          if (question) {
             setMistakes(prev => {
                const existing = prev.find(m => m.questionType === question!.type);
                if (existing) {
                    return prev.map(m => m.questionType === question!.type ? { ...m, count: m.count + 1, timestamp: Date.now() } : m);
                }
                return [...prev, { questionType: question!.type, count: 1, timestamp: Date.now() }];
             });
             
             // Log detailed wrong answer
             if (selectedOption !== undefined) {
                 const log: WrongAnswerLog = {
                     id: Date.now().toString() + Math.random().toString(),
                     question: question,
                     wrongOption: selectedOption,
                     timestamp: Date.now()
                 };
                 setWrongAnswers(prev => [log, ...prev]);
             }
          }
          onFailure();
        }
        setShowMathModal(false);
        setCurrentQuestion(null);
      };
    });
  };

  const handleMathAnswer = (isCorrect: boolean, selectedOption?: number) => {
    if (pendingAction) {
      pendingAction(isCorrect, selectedOption);
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Top Right Controls */}
        <div className="absolute top-0 right-0 lg:right-4 lg:top-4 z-50 flex gap-2">
            {/* Settings Button */}
            <button
                onClick={() => setShowSettings(true)}
                className="p-3 rounded-full shadow-lg transition-all bg-white text-gray-600 hover:bg-gray-50"
                title="语音设置"
            >
                <Settings className="w-6 h-6" />
            </button>

            {/* Sound Toggle Button */}
            <button
            onClick={() => {
                setSoundEnabled(!soundEnabled);
                initAudio(); // Also init on click
            }}
            className={`p-3 rounded-full shadow-lg transition-all ${soundEnabled ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
            title={soundEnabled ? "关闭声音" : "开启声音"}
            >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
        </div>


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

          {/* Mistake Stats & Button */}
          {(mistakes.length > 0 || wrongAnswers.length > 0) && (
             <div className="bg-orange-50 rounded-2xl p-4 shadow-sm border border-orange-200">
                <h3 className="text-orange-800 font-bold text-sm flex items-center justify-between mb-3">
                   <div className="flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> 学习重点</div>
                </h3>
                
                {/* Stats Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                   {mistakes.sort((a,b) => b.count - a.count).slice(0, 3).map((m, i) => (
                      <span key={i} className="text-xs bg-white text-orange-600 px-2 py-1 rounded border border-orange-100 font-medium">
                        {m.questionType === 'MUL' ? '乘法' : m.questionType === 'DIV' ? '除法' : m.questionType === 'ADD' ? '加法' : '减法'}
                        <span className="ml-1 font-bold">x{m.count}</span>
                      </span>
                   ))}
                </div>

                {/* Review Button */}
                <button 
                  onClick={() => setShowMistakeModal(true)}
                  className="w-full bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold py-2 px-4 rounded-xl text-sm flex items-center justify-center transition-colors"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> 查看错题本 ({wrongAnswers.length})
                </button>
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
            isAiRolling={isDiceRolling && currentPlayer.isAi}
            visualEffects={visualEffects}
            // New 3D Dice Props
            diceValue={diceValue}
            isDiceRolling={isDiceRolling}
            onDiceAnimationComplete={onDiceAnimationComplete}
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

      {/* Math Challenge Modal */}
      {showMathModal && (
        <MathChallenge 
          question={currentQuestion} 
          isLoading={isQuestionLoading}
          onAnswer={handleMathAnswer} 
        />
      )}

      {/* Voice Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800 flex items-center">
                       <Settings className="w-5 h-5 mr-2" /> 语音设置
                   </h2>
                   <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                       <X className="w-6 h-6" />
                   </button>
               </div>
               
               <div className="space-y-6">
                   {/* Voice Select */}
                   <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">选择声音</label>
                       <select 
                           className="w-full p-3 border rounded-xl bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400 outline-none"
                           value={voiceConfig.voiceName}
                           onChange={(e) => setVoiceConfig({...voiceConfig, voiceName: e.target.value})}
                       >
                           {availableVoices.map((v) => (
                               <option key={v.name} value={v.name}>
                                   {v.name} {v.lang ? `(${v.lang})` : ''}
                               </option>
                           ))}
                           {availableVoices.length === 0 && <option>未检测到语音包</option>}
                       </select>
                   </div>
                   
                   {/* Rate Slider */}
                   <div>
                       <div className="flex justify-between mb-2">
                           <label className="text-sm font-bold text-gray-700">语速</label>
                           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{voiceConfig.rate.toFixed(1)}x</span>
                       </div>
                       <input 
                           type="range" min="0.5" max="2.0" step="0.1"
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                           value={voiceConfig.rate}
                           onChange={(e) => setVoiceConfig({...voiceConfig, rate: parseFloat(e.target.value)})}
                       />
                       <div className="flex justify-between text-xs text-gray-400 mt-1">
                           <span>慢</span>
                           <span>正常</span>
                           <span>快</span>
                       </div>
                   </div>

                    {/* Pitch Slider */}
                   <div>
                       <div className="flex justify-between mb-2">
                           <label className="text-sm font-bold text-gray-700">音调</label>
                           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{voiceConfig.pitch.toFixed(1)}</span>
                       </div>
                       <input 
                           type="range" min="0.5" max="2.0" step="0.1"
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                           value={voiceConfig.pitch}
                           onChange={(e) => setVoiceConfig({...voiceConfig, pitch: parseFloat(e.target.value)})}
                       />
                       <div className="flex justify-between text-xs text-gray-400 mt-1">
                           <span>低沉</span>
                           <span>正常</span>
                           <span>尖细</span>
                       </div>
                   </div>

                   {/* Test Button */}
                   <button 
                       onClick={testVoice}
                       className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold flex items-center justify-center transition-colors"
                   >
                       <PlayCircle className="w-5 h-5 mr-2" /> 试听当前设置
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* Mistake Review Modal */}
      {showMistakeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border-4 border-orange-200">
              {/* Header */}
              <div className="bg-orange-100 p-4 border-b border-orange-200 flex items-center justify-between">
                 <div className="flex items-center text-orange-800 font-bold text-xl">
                    <BookOpen className="w-6 h-6 mr-2" /> 错题本
                 </div>
                 <button 
                   onClick={() => setShowMistakeModal(false)}
                   className="p-2 hover:bg-orange-200 rounded-full transition-colors text-orange-800"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 space-y-6 bg-orange-50/50 flex-1">
                 {wrongAnswers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                       <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
                       <p className="text-lg">太棒了！目前没有错题记录。</p>
                    </div>
                 ) : (
                    wrongAnswers.map((log) => (
                       <div key={log.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative">
                          <div className="absolute top-4 right-4 text-xs font-mono text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="mb-4">
                             <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2 font-bold">
                                {log.question.type === 'ADD' ? '加法' : log.question.type === 'SUB' ? '减法' : log.question.type === 'MUL' ? '乘法' : '除法'}
                             </span>
                             <p className="text-lg font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {log.question.question}
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center text-red-700">
                                <XCircle className="w-5 h-5 mr-2 shrink-0" />
                                <div>
                                   <div className="text-xs text-red-400 font-bold uppercase">你的答案</div>
                                   <div className="font-mono font-bold text-lg">{log.wrongOption}</div>
                                </div>
                             </div>
                             <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex items-center text-green-700">
                                <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                                <div>
                                   <div className="text-xs text-green-400 font-bold uppercase">正确答案</div>
                                   <div className="font-mono font-bold text-lg">{log.question.answer}</div>
                                </div>
                             </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100">
                             <span className="font-bold mr-1">💡 解析:</span> {log.question.explanation}
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              <div className="p-4 bg-white border-t border-gray-100 text-center">
                 <p className="text-xs text-gray-400">温故而知新，常回来看看哦！</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;