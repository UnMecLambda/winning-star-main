import type { Express } from 'express';

import managerBootstrap from './manager/routes/bootstrap';
import managerMe from './manager/routes/me';
import managerPlayers from './manager/routes/players';
import managerTeam from './manager/routes/team';
import managerMatch from './manager/routes/match';
import managerEconomy from './manager/routes/economy';
import friendlyRouter from './manager/routes/friendly';
import matchmakingRouter from './manager/routes/matchmaking';
import seasonRouter from './manager/routes/season';
import { aiRouter } from './manager/routes/ai';
import debugRouter from './manager/routes/debug';

/** Monte toutes les routes Manager sous /api/manager/* */
export function mountManager(app: Express) {
  // Core
  app.use('/api/manager', managerBootstrap);          // POST /api/manager/bootstrap
  app.use('/api/manager/me', managerMe);              // GET  /api/manager/me/team
  app.use('/api/manager/players', managerPlayers);    // catalog joueurs
  app.use('/api/manager/team', managerTeam);          // buy, set-starters
  app.use('/api/manager/match', managerMatch);        // simulate, history
  app.use('/api/manager/economy', managerEconomy);    // earn, rewards

  // Modes & extra
  app.use('/api/manager/friendly', friendlyRouter);
  app.use('/api/manager/matchmaking', matchmakingRouter);
  app.use('/api/manager/season', seasonRouter);

  // IA + debug
  app.use('/api/manager/ai', aiRouter);
  app.use('/api/manager/debug', debugRouter);
}
