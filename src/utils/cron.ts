import { Channel } from './channel';
import { IGameDocument } from './../database/games/games.types';
import { UserModel } from './../database/users/users.model';
import fetch from 'node-fetch';
import { getGame } from '../crackwatch/methods';
import { logger } from '../main';
import { setInterval } from 'timers';

const schedule = Number.parseInt(process.env.CRACKWATCH_SCHEDULE) ?? 60 * 60 * 1000; // Default 1h

async function task(): Promise<void> {
  logger.info('cron: scheduled task started');

  const games = await getGamesToUpdate();

  logger.info(`cron: games to update ${games.length}`);

  games.forEach(async (game) => {
    const chnl: Channel<IGameDocument> = new Channel();
    getGame(game.slug, chnl);
    const newGame = await chnl.recv();

    if (newGame.isCracked()) {
      logger.info(`cron: ${game.title} is cracked!`);

      const users = await UserModel.find({ subscriptions: newGame }).exec();

      users.forEach(async (user, i) => {
        await new Promise((r) => setTimeout(r, 20 * i + 1));

        // Notify user
        sendNotification(user.userId, game.getGameCard());

        // Unsusbscribe user
        user.subscriptions = user.subscriptions.filter((g) => g.id != game.id);
        user.save();
      });
    }
  });
}

async function sendNotification(chat_id: number, text: string): Promise<void> {
  fetch(`https://api.telegram.org/bot${process.env.CRACKWATCH_TOKEN}/sendMessage`, {
    method: 'POST',
    compress: true,
    headers: { 'content-type': 'application/json', connection: 'keep-alive' },
    body: JSON.stringify({
      chat_id,
      text,
      parse_mode: 'HTML',
    }),
  });
}

async function getGamesToUpdate(): Promise<Array<IGameDocument>> {
  const usersWithGames = await UserModel.find({ subscriptions: { $exists: true, $not: { $size: 0 } } })
    .populate('subscriptions')
    .exec();

  const games = usersWithGames.map((u) => u.subscriptions).flat();
  return games.filter((g, i) => games.indexOf(g) === i && !g.isCracked());
}

export async function startTask(): Promise<void> {
  logger.info('cron: creating background task');
  setInterval(task, schedule);
}
