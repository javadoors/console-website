## console-website-dev 开发 Pod 使用指南

1. 选择 openFuyao 集群中的某一节点作为开发节点，使用 vscode ssh 连接，克隆 console-website 代码。

2. 浏览器打开该节点上的管理面，完成一次登录，不要退出登录以在本地保留 Cookie 令牌。

3. 修改 `dev-pod.yaml`：
    
   - 修改名为 `code` 的 volume hostPath.path 为项目的绝对路径，从而挂载源代码到 Pod 中；
   - 修改 `nodeName` 为当前开发节点的节点名称，从而保证该 Pod 绑定到开发节点。

   > 该 pod 的其他要点如下（无需修改）：
   > - 使用node:20-slim镜像；
   > - 设置环境变量 `DEV_POD`，用于暴露给 `vite` 以修改开发配置；
   > - 端口为 8080，与 console-website Service 保持一致；
   > - 挂载与 console-website Deployment 相同的证书 Secret；
   > - 使用标签 `console-website-dev`。

5. 修改 console-website service 标签选择器，将 `app=console-website` 改为 `app=console-website-dev`。

6. 修改 console-service service 类型为 NodePort，在浏览器通过 console-service 的 NodePort 端口访问。

   > openFuyao ingress 对请求速率有限制，无法支持开发态的大量前端文件请求。