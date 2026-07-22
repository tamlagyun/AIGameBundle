import { EventKeyboard, EventTouch, input, Input, KeyCode, Node, Vec2 } from 'cc';

/** 将键盘和摇杆输入归一为玩家移动方向，不包含任何角色或网络逻辑。 */
export class PlayerInputController {
  private static readonly JOYSTICK_RADIUS = 120;
  private readonly pressedKeys = new Set<KeyCode>();
  private joystickTouchId: number | null = null;
  private readonly joystickOrigin = new Vec2();
  private readonly joystickDirection = new Vec2();
  private joystickKnob?: Node;

  public setJoystickKnob(node: Node | undefined): void {
    this.joystickKnob = node;
  }

  public bind(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  public unbind(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    this.pressedKeys.clear();
    this.resetJoystick();
  }

  public readDirection(): Vec2 {
    const left = this.pressedKeys.has(KeyCode.KEY_A) || this.pressedKeys.has(KeyCode.ARROW_LEFT);
    const right = this.pressedKeys.has(KeyCode.KEY_D) || this.pressedKeys.has(KeyCode.ARROW_RIGHT);
    const up = this.pressedKeys.has(KeyCode.KEY_W) || this.pressedKeys.has(KeyCode.ARROW_UP);
    const down = this.pressedKeys.has(KeyCode.KEY_S) || this.pressedKeys.has(KeyCode.ARROW_DOWN);
    return new Vec2(Number(right) - Number(left) + this.joystickDirection.x, Number(up) - Number(down) + this.joystickDirection.y);
  }

  public readonly onJoystickStart = (event: EventTouch): void => {
    if (this.joystickTouchId !== null) return;
    const location = event.getUILocation();
    this.joystickTouchId = event.getID();
    this.joystickOrigin.set(location.x, location.y);
    this.joystickDirection.set(0, 0);
    this.joystickKnob?.setPosition(110, 110, 0);
  };

  public readonly onJoystickMove = (event: EventTouch): void => {
    if (event.getID() !== this.joystickTouchId) return;
    const location = event.getUILocation();
    this.joystickDirection.set(
      (location.x - this.joystickOrigin.x) / PlayerInputController.JOYSTICK_RADIUS,
      (location.y - this.joystickOrigin.y) / PlayerInputController.JOYSTICK_RADIUS
    );
    if (this.joystickDirection.length() > 1) this.joystickDirection.normalize();
    this.joystickKnob?.setPosition(
      110 + this.joystickDirection.x * PlayerInputController.JOYSTICK_RADIUS * 0.55,
      110 + this.joystickDirection.y * PlayerInputController.JOYSTICK_RADIUS * 0.55,
      0
    );
  };

  public readonly onJoystickEnd = (event: EventTouch): void => {
    if (event.getID() !== this.joystickTouchId) return;
    this.resetJoystick();
  };

  private readonly onKeyDown = (event: EventKeyboard): void => this.pressedKeys.add(event.keyCode);
  private readonly onKeyUp = (event: EventKeyboard): void => this.pressedKeys.delete(event.keyCode);

  private resetJoystick(): void {
    this.joystickTouchId = null;
    this.joystickDirection.set(0, 0);
    this.joystickKnob?.setPosition(110, 110, 0);
  }
}
