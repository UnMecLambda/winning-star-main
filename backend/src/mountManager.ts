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
import aiRouter, { aiRouter as aiRouterNamed } from './manager/routes/ai';
import debugRouter from './manager/routes/debug';

export function mountManager(app: Express) {
  app.use('/api/manager', managerBootstrap);
  app.use('/api/manager/me', managerMe);
  app.use('/api/manager/players', managerPlayers);
  app.use('/api/manager/team', managerTeam);
  app.use('/api/manager/match', managerMatch);
  app.use('/api/manager/economy', managerEconomy);
  app.use('/api/manager/friendly', friendlyRouter);
  app.use('/api/manager/matchmaking', matchmakingRouter);
  app.use('/api/manager/season', seasonRouter);
  app.use('/api/manager/ai', aiRouter ?? aiRouterNamed);
  app.use('/api/manager/debug', debugRouter);
}
