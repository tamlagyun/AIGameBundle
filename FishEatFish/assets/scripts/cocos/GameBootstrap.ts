import { _decorator, Component } from 'cc';
import { GameRuntime } from '../runtime/GameRuntime.ts';

const { ccclass } = _decorator;

/** Cocos 场景脚本入口：只负责引擎生命周期与游戏运行时的装配。 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  private runtime?: GameRuntime;

  protected async start(): Promise<void> {
    this.runtime = new GameRuntime(this.node);
    await this.runtime.start();
  }

  protected update(deltaTime: number): void {
    this.runtime?.update(deltaTime);
  }

  protected onDestroy(): void {
    this.runtime?.destroy();
    this.runtime = undefined;
  }
}
