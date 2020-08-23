import { bot, logger } from '../main';

import { Channel } from './channel';
import { IGameDocument } from './../database/games/games.types';
import { UserModel } from './../database/users/users.model';
import { getGame } from '../crackwatch/methods';
import { setInterval } from 'timers';

const schedule = Number.parseInt(process.env.CRACKWATCH_SCHEDULE) ?? 60 * 60 * 1000; // Default 1h
export let TASK_INTERVAL: NodeJS.Timeout;

async function task(): Promise<void> {
  logger.info('cron: scheduled task started');

  const games = await getGamesToUpdate();

  logger.info(`cron: games to update ${games.length}`);

  games.forEach(async (game) => {
    const chnl: Channel<IGameDocument> = new Channel();
    getGame(game.slug, chnl);
    const newGame = await chnl.recv();

    const justReleased =
      newGame.releaseDate.getTime() <= Date.now() && newGame.releaseDate.getTime() >= game.lastUpdated.getTime();

    if (newGame.isCracked() || justReleased) {
      logger.info(`cron: ${game.title} is ${newGame.isCracked() ? 'cracked' : 'released'}!`);

      const users = await UserModel.find({ subscriptions: newGame }).exec();

      users.forEach(async (user, i) => {
        await new Promise((r) => setTimeout(r, 20 * i + 1));

        let text = `${bot.context.i18n.t('released', { gameName: game.title, link: game.links?.['steam'] })}`;

        // Unsubscribe user
        if (newGame.isCracked()) {
          user.subscriptions = user.subscriptions.filter((g) => g.id != game.id);
          user.save();

          text = game.getGameCard();
        }
        // Notify user
        sendNotification(user.userId, text);
      });
    }
  });
}

async function sendNotification(chat_id: number, text: string): Promise<void> {
  bot.telegram.sendMessage(chat_id, text, { parse_mode: 'HTML' });
}

async function getGamesToUpdate(): Promise<Array<IGameDocument>> {
  const usersWithGames = await UserModel.find({ subscriptions: { $exists: true, $not: { $size: 0 } } })
    .populate('subscriptions')
    .exec();

  const games = usersWithGames.map((u) => u.subscriptions).flat();
  return games.filter((g, i) => games.indexOf(g) === i && !g.isCracked());
}

export async function startTask(run = false): Promise<void> {
  logger.info('cron: creating background task');
  if (run) {
    task();
  }
  TASK_INTERVAL = setInterval(task, schedule);
}
