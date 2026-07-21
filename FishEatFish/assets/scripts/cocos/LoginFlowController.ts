import { Node } from 'cc';
import { LoginDialog } from './LoginDialog.ts';
import { RealtimeSession } from '../network/RealtimeSession.ts';
import { resolveNetworkEndpoint } from '../network/NetworkEnvironment.ts';
import type { NetworkMessage } from '../network/NetworkProtocol.ts';

export interface LoginFlowControllerOptions {
  getInputLayer: () => Node | undefined;
  realtime: RealtimeSession;
  onValidationError?: () => void;
  onUsernameAccepted?: (username: string) => void;
  onMessage: (message: NetworkMessage) => void;
  onDiagnostic: (detail: string) => void;
  onConnected: () => void;
  onConnectionLost: (reason: string) => void;
}

/**
 * 登录流程控制器。
 *
 * 它只负责选择登录入口、保存当前测试用户名并把结果交给外部流程；
 * 具体的输入框、按钮和 DOM/Cocos 视觉实现仍由 LoginDialog 负责。
 */
export class LoginFlowController {
  private dialog?: LoginDialog;
  private username = '';
  private offlineModeSelected = false;
  private isDestroying = false;

  public constructor(private readonly options: LoginFlowControllerOptions) {}

  public get currentUsername(): string {
    return this.username;
  }

  public get isDialogOpen(): boolean {
    return this.dialog?.isOpen ?? false;
  }

  public openTestEnvironment(initialUsername = this.username): void {
    const inputLayer = this.options.getInputLayer();
    if (!inputLayer || this.isDialogOpen) return;
    this.username = initialUsername;
    const isEditorPreview = typeof window !== 'undefined' && window.location.hostname === 'scene';
    this.dialog = LoginDialog.open({
      variant: 'test-environment',
      presentation: isEditorPreview || typeof document === 'undefined' ? 'cocos' : 'dom',
      parent: inputLayer,
      title: '测试环境登录',
      description: '输入用户名后进入默认海域',
      placeholder: '用户名（1-16 个字符）',
      submitText: '进入海域',
      initialUsername: this.username,
      maxLength: 16,
      onValidationError: this.options.onValidationError,
      onSubmit: (username) => {
        this.username = username;
        this.dialog = undefined;
        this.options.onUsernameAccepted?.(username);
        void this.connectOnline();
      }
    });
  }

  public async connectOnline(username = this.username): Promise<void> {
    if (this.offlineModeSelected || this.isDestroying) return;
    this.username = username;
    try {
      const endpoint = resolveNetworkEndpoint();
      const runtime = typeof window !== 'undefined' ? window.location.href : 'no-window-runtime';
      this.options.onDiagnostic(`runtime=${runtime}\nHTTP=${endpoint.httpBaseUrl}`);
      const authResponse = await fetch(`${endpoint.httpBaseUrl}/auth/test-login`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: this.username })
      });
      if (!authResponse.ok) throw new Error(`AUTH_FAILED status=${authResponse.status}`);
      const auth = await authResponse.json() as { token: string };
      const matchResponse = await fetch(`${endpoint.httpBaseUrl}/match/join`, {
        method: 'POST',
        headers: { authorization: `Bearer ${auth.token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ mapId: 'sea-default-001' })
      });
      if (!matchResponse.ok) throw new Error(`MATCH_FAILED status=${matchResponse.status}`);
      this.options.realtime.onMessage = (message) => this.options.onMessage(message);
      this.options.realtime.onDiagnostic = (detail) => this.options.onDiagnostic(detail);
      this.options.realtime.onStatus = (status) => {
        if (status === 'open') { this.options.realtime.join(); this.options.onConnected(); }
        if ((status === 'error' || status === 'closed') && !this.isDestroying && !this.offlineModeSelected) {
          this.options.onConnectionLost('在线服务连接已断开');
        }
      };
      this.options.realtime.connect(endpoint.websocketUrl, auth.token);
    } catch (error) {
      this.options.onDiagnostic(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      this.options.onConnectionLost('无法连接在线服务');
    }
  }

  public retry(): void {
    this.offlineModeSelected = false;
    this.options.realtime.close();
    void this.connectOnline();
  }

  public selectOffline(): void {
    this.offlineModeSelected = true;
    this.options.realtime.close();
  }

  public close(): void {
    this.isDestroying = true;
    this.dialog?.close();
    this.dialog = undefined;
    this.options.realtime.close();
  }
}
