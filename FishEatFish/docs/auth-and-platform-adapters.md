# 鉴权与平台适配

测试版使用自建内存账号。客户端只持有短期 token；服务端保存 token 到账号的内存映射。微信、抖音、Android、iOS 和鸿蒙通过 `PlatformAuthPort` 扩展，不把平台 SDK 引用放入核心网络协议。

真实 AppID、密钥、证书和生产 token 禁止提交到版本库。
