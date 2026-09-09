// Intelligent Heuristic Domain Synthesis Engine (100% Offline & Deterministic)

export class HeuristicProvider {
  constructor() {
    this.name = 'HeuristicEngine';
  }

  analyzePrompt(prompt) {
    const text = prompt.toLowerCase();
    
    // Domain inference heuristics
    let domainType = 'general';
    if (text.includes('drone') || text.includes('deliver') || text.includes('logistics') || text.includes('courier')) {
      domainType = 'logistics';
    } else if (text.includes('health') || text.includes('patient') || text.includes('doctor') || text.includes('medical')) {
      domainType = 'health';
    } else if (text.includes('rent') || text.includes('booking') || text.includes('vehicle') || text.includes('parking') || text.includes('car')) {
      domainType = 'rental';
    } else if (text.includes('shop') || text.includes('store') || text.includes('market') || text.includes('cart') || text.includes('order')) {
      domainType = 'ecommerce';
    } else if (text.includes('social') || text.includes('chat') || text.includes('feed') || text.includes('post') || text.includes('community')) {
      domainType = 'social';
    }

    // Extract potential system name
    let systemName = 'Autonomous Platform';
    const nameMatch = prompt.match(/called\s+["']?([A-Za-z0-9_\-]+)["']?/i) ||
                      prompt.match(/named\s+["']?([A-Za-z0-9_\-]+)["']?/i);
    if (nameMatch && nameMatch[1]) {
      systemName = nameMatch[1];
    } else {
      const words = prompt.split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) {
        systemName = words[0].charAt(0).toUpperCase() + words[0].slice(1) + 'Hub';
      }
    }

    return { domainType, systemName };
  }

  synthesizeOntology(prompt) {
    const { domainType, systemName } = this.analyzePrompt(prompt);
    
    let actors = [
      { name: 'EndUser', category: 'Human_Primary', role: 'Main consumer accessing client interfaces' },
      { name: 'PlatformAdmin', category: 'Human_Secondary', role: 'System supervisor managing platform governance' },
      { name: 'AuthIdentityService', category: 'External_System', role: 'Issues JWT tokens and handles OAuth verification' },
      { name: 'NotificationGateway', category: 'External_System', role: 'Dispatches real-time alerts and email notifications' }
    ];

    let boundaryConstraints = [
      'All client requests to protected routes require active JWT bearer token verification.',
      'Data mutations are strictly bounded by resource ownership assertions.',
      'External payment and communication gateways are called asynchronously with idempotent webhooks.'
    ];

    if (domainType === 'logistics') {
      actors.push(
        { name: 'Merchant', category: 'Human_Primary', role: 'Fulfills and stages inventory packages' },
        { name: 'FleetController', category: 'Human_Secondary', role: 'Monitors aerial corridors and vehicle telemetry' },
        { name: 'AirspaceTelemetryAPI', category: 'External_System', role: 'Ingests real-time spatial GPS coordinates' }
      );
      boundaryConstraints.push('Vehicles cannot be dispatched if battery level is below return reserve margin.');
    } else if (domainType === 'rental') {
      actors.push(
        { name: 'Owner', category: 'Human_Primary', role: 'Lists rental inventory and sets availability calendar' },
        { name: 'Renter', category: 'Human_Primary', role: 'Searches spots/items and books time slots' },
        { name: 'StripePaymentGateway', category: 'External_System', role: 'Escrows rental deposit and processes charges' }
      );
      boundaryConstraints.push('Overlapping booking reservations are prevented via atomic database lock.');
    }

    return {
      project_id: systemName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      project_name: `${systemName} Platform`,
      version: '1.0.0',
      description: prompt.trim(),
      domain_type: domainType,
      actors,
      boundary_constraints: boundaryConstraints
    };
  }
}
