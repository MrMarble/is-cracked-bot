import { bot, logger } from '../main';

import { Channel } from './channel';
import { IGameDocument } from './../database/games/games.types';
import { UserModel } from './../database/users/users.model';
import { getGames } from '../crackwatch/methods';
import { i18n } from '../telegram/telegram';
import { setInterval } from 'timers';

const schedule = Number.parseInt(process.env.CRACKWATCH_SCHEDULE) ?? 60 * 60 * 1000; // Default 1h
export let TASK_INTERVAL: NodeJS.Timeout;

async function task(): Promise<void> {
  logger.info('cron: scheduled task started');

  const games = await getGamesToUpdate();

  logger.info(`cron: games to update ${games.length}`);

  const slugs = games.map((game) => game.slug);
  const chnl: Channel<IGameDocument> = new Channel();
  getGames(slugs, chnl);

  chnl.forEach(async (newGame) => {
    const game = games.find((g) => g.slug == newGame.slug);
    const justReleased =
      newGame.releaseDate.getTime() <= Date.now() && newGame.releaseDate.getTime() >= game.lastUpdated.getTime();

    if (newGame.isCracked() || justReleased) {
      logger.info(`cron: ${game.title} is ${newGame.isCracked() ? 'cracked' : 'released'}!`);

      const users = await UserModel.find({ subscriptions: newGame }).exec();

      users.forEach(async (user, i) => {
        await new Promise((r) => setTimeout(r, 20 * i + 1));

        let text = `<b>${game.title}</b> has been released!`;
        if (game.links?.['steam']) {
          text += `\nCheck it out on <a href="${game.links['steam']}">steam</a>`;
        }
        // Unsubscribe user
        if (newGame.isCracked()) {
          user.subscriptions = user.subscriptions.filter((g) => g.id != newGame.id);
          user.save();

          text = newGame.getGameCard();
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
