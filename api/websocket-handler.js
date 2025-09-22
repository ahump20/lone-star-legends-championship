/**
 * Blaze Intelligence WebSocket Handler
 * Real-time data streaming for Champion Enigma Engine
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env);
    }
    
    // Handle REST API fallback
    if (url.pathname.startsWith('/api/')) {
      return handleRestAPI(request, env);
    }
    
    return new Response('Not found', { status: 404 });
  }
};

async function handleWebSocket(request, env) {
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);
  
  // Accept the WebSocket connection
  server.accept();
  
  // Set up real-time data streaming
  const streamInterval = setInterval(() => {
    const data = generateRealTimeData();
    
    try {
      server.send(JSON.stringify({
        type: 'data_update',
        timestamp: Date.now(),
        data: data
      }));
    } catch (error) {
      console.error('WebSocket send error:', error);
      clearInterval(streamInterval);
    }
  }, 2000);
  
  // Handle incoming messages
  server.addEventListener('message', event => {
    try {
      const message = JSON.parse(event.data);
      handleClientMessage(message, server, env);
    } catch (error) {
      console.error('Message parsing error:', error);
    }
  });
  
  // Handle connection close
  server.addEventListener('close', () => {
    clearInterval(streamInterval);
    console.log('WebSocket connection closed');
  });
  
  // Handle errors
  server.addEventListener('error', error => {
    console.error('WebSocket error:', error);
    clearInterval(streamInterval);
  });
  
  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function handleRestAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  switch (path) {
    case '/api/champion-enigma':
      return handleChampionEnigma(request, env);
    case '/api/decision-velocity':
      return handleDecisionVelocity(request, env);
    case '/api/pattern-recognition':
      return handlePatternRecognition(request, env);
    case '/api/readiness':
      return handleReadinessData(request, env);
    default:
      return new Response('API endpoint not found', { status: 404 });
  }
}

async function handleChampionEnigma(request, env) {
  const data = generateChampionEnigmaData();
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: Date.now(),
    data: data
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function handleDecisionVelocity(request, env) {
  const data = {
    reactionTime: 0.23 + (Math.random() - 0.5) * 0.05,
    marketLag: 1.4 + (Math.random() - 0.5) * 0.2,
    advantage: null,
    confidence: 0.7 + Math.random() * 0.3,
    trend: Math.random() > 0.5 ? 'improving' : 'stable'
  };
  
  data.advantage = data.marketLag - data.reactionTime;
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: Date.now(),
    data: data
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handlePatternRecognition(request, env) {
  const patterns = [
    { type: 'Cover 2', confidence: 0.73, formation: 'Bear Market Defense' },
    { type: 'Blitz', confidence: 0.89, formation: 'Volatility Spike' },
    { type: 'RPO', confidence: 0.67, formation: 'Merger Arbitrage' },
    { type: 'Zone Coverage', confidence: 0.82, formation: 'Risk Parity' },
    { type: 'Man Coverage', confidence: 0.75, formation: 'Alpha Generation' }
  ].filter(p => p.confidence > 0.70);
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: Date.now(),
    patterns: patterns,
    totalPatterns: patterns.length
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleReadinessData(request, env) {
  const data = {
    momentum: 67.3 + (Math.random() - 0.5) * 10,
    leverage: 2.4 + (Math.random() - 0.5) * 0.5,
    championScore: 87.5 + (Math.random() - 0.5) * 5,
    lastUpdated: new Date().toISOString()
  };
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: Date.now(),
    data: data
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=5',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function handleClientMessage(message, server, env) {
  switch (message.type) {
    case 'subscribe':
      // Handle subscription to specific data streams
      server.send(JSON.stringify({
        type: 'subscription_confirmed',
        stream: message.stream,
        timestamp: Date.now()
      }));
      break;
      
    case 'request_update':
      // Send immediate data update
      const data = generateRealTimeData();
      server.send(JSON.stringify({
        type: 'data_update',
        timestamp: Date.now(),
        data: data
      }));
      break;
      
    default:
      server.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        timestamp: Date.now()
      }));
  }
}

function generateRealTimeData() {
  const dimensions = [
    'Clutch Gene', 'Killer Instinct', 'Flow State',
    'Mental Fortress', 'Predator Mindset', 'Champion Aura',
    'Winner DNA', 'Beast Mode'
  ];
  
  const data = {
    timestamp: Date.now(),
    momentum: 67.3 + (Math.random() - 0.5) * 10,
    leverage: 2.4 + (Math.random() - 0.5) * 0.5,
    championScore: 87.5 + (Math.random() - 0.5) * 5,
    dimensions: {}
  };
  
  // Generate scores for each dimension
  dimensions.forEach(dim => {
    data.dimensions[dim] = {
      score: 70 + Math.random() * 30,
      confidence: 0.7 + Math.random() * 0.3,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      delta: (Math.random() - 0.5) * 5
    };
  });
  
  // Add decision velocity metrics
  data.decisionVelocity = {
    reactionTime: 0.23 + (Math.random() - 0.5) * 0.05,
    marketLag: 1.4 + (Math.random() - 0.5) * 0.2,
    advantage: null
  };
  data.decisionVelocity.advantage = 
    data.decisionVelocity.marketLag - data.decisionVelocity.reactionTime;
  
  // Add pattern recognition data
  data.patterns = [
    { type: 'Cover 2', confidence: 0.73, formation: 'Bear Market Defense' },
    { type: 'Blitz', confidence: 0.89, formation: 'Volatility Spike' },
    { type: 'RPO', confidence: 0.67, formation: 'Merger Arbitrage' }
  ].filter(p => p.confidence > 0.73);
  
  // Add cognitive load distribution
  data.cognitiveLoad = {
    perception: 67 + Math.random() * 20,
    decision: 89 - Math.random() * 15,
    execution: 45 + Math.random() * 25
  };
  
  return data;
}

function generateChampionEnigmaData() {
  const dimensions = [
    'Clutch Gene', 'Killer Instinct', 'Flow State',
    'Mental Fortress', 'Predator Mindset', 'Champion Aura',
    'Winner DNA', 'Beast Mode'
  ];
  
  const enigmaData = {
    coreIntensity: 0.7 + Math.random() * 0.3,
    dimensionReadings: {},
    connectionStrength: 0.8 + Math.random() * 0.2,
    overallChampionIndex: 0
  };
  
  let totalScore = 0;
  dimensions.forEach(dim => {
    const score = 70 + Math.random() * 30;
    enigmaData.dimensionReadings[dim] = {
      intensity: score / 100,
      resonance: 0.6 + Math.random() * 0.4,
      stability: 0.7 + Math.random() * 0.3
    };
    totalScore += score;
  });
  
  enigmaData.overallChampionIndex = totalScore / (dimensions.length * 100);
  
  return enigmaData;
}