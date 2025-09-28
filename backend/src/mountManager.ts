import type { Express } from 'express';

import managerBootstrap from './manager/routes/bootstrap';
import managerMe from './manager/routes/me';
import managerPlayers from './manager/routes/players';
import managerTeam from './manager/routes/team';
import managerMatch from './manager/routes/match';
import managerEconomy from './manager/routes/economy';
import friendlyRouter from './manager/routes/friendly';
import matchmakingRouter from './manager/routes/matchmaking';

/**
 * Monte les routes Manager sous /api/manager/*
 * (Ne touche pas à la connexion Mongo : déjà gérée dans server.ts)
 */
export function mountManager(app: Express) {
  app.use('/api/manager', managerBootstrap);              // POST /api/manager/bootstrap
  app.use('/api/manager/me', managerMe);                  // GET  /api/manager/me
  app.use('/api/manager/players', managerPlayers);        // GET  /api/manager/players
  app.use('/api/manager/team', managerTeam);              // POST /buy, /set-starters
  app.use('/api/manager/match', managerMatch);            // POST /simulate
  app.use('/api/manager/economy', managerEconomy);        // POST /earn
  app.use('/api/manager/friendly', friendlyRouter);
  app.use('/api/manager/matchmaking', matchmakingRouter);

}
