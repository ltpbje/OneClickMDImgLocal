# Markdown 图片本地化工具

一个用于将 Markdown 文件中的在线图片转换为本地图片的 Node.js 工具，支持将图片保存到指定目录并更新 Markdown 文件中的图片路径。

## 功能特点

- ✅ **自动提取**：自动提取 Markdown 文件中的所有在线图片 URL
- ✅ **本地保存**：将图片下载到 `assets` 文件夹
- ✅ **相对路径**：自动更新 Markdown 文件中的图片路径为相对路径
- ✅ **跨平台**：使用正斜杠(`/`)作为路径分隔符，支持 Windows、macOS 和 Linux
- ✅ **新文件生成**：生成一个新的 Markdown 文件，保留原始文件不变
- ✅ **错误处理**：优雅处理网络错误和文件操作错误

## 安装步骤

### 1. 克隆或下载项目

```bash
# 克隆项目（如果使用 Git）
git clone <repository-url>

# 或者直接下载项目文件
```

### 2. 安装依赖

```bash
# 进入项目目录
cd <project-directory>

# 安装依赖
npm install
```

## 使用方法

### 命令行参数方式

```bash
node index.js <Markdown文件路径>
```

例如：

```bash
node index.js ./test_original.md
```

### 交互式方式

```bash
npm start
```

然后按照提示输入 Markdown 文件路径。

## 运行结果

### 生成的文件和目录

- **`assets/`**：存放下载的本地图片
- **`<原始文件名>_local.md`**：转换后的 Markdown 文件

### 示例

#### 转换前

```markdown
![示例图片](https://picsum.photos/200/300)
```

#### 转换后

```markdown
![示例图片](assets/image_1768491853469_567.jpg)
```

## 项目结构

```
├── index.js                  # 主脚本文件
├── package.json              # 项目配置文件
├── README.md                 # 项目说明文档
├── assets/                   # 图片存储目录
│   └── image_*.jpg           # 下载的图片文件
├── <原始文件>.md             # 输入的 Markdown 文件
└── <原始文件>_local.md       # 输出的 Markdown 文件
```

## 技术实现

### 核心功能

1. **图片提取**：使用正则表达式 `!\[(.*?)\]\((https?:\/\/.*?)\)` 提取在线图片
2. **图片下载**：使用 `axios` 库下载图片
3. **文件操作**：使用 Node.js 内置的 `fs` 和 `path` 模块处理文件和路径
4. **路径转换**：将绝对路径转换为相对路径，并使用正斜杠分隔

### 依赖库

- **axios**：用于下载网络图片

## 自定义配置

### 修改图片存储目录

如需修改图片存储目录，可以修改 `index.js` 文件中的以下代码：

```javascript
const savePath = path.join(__dirname, 'assets', fileName);
```

将 `'assets'` 替换为您想要的目录名称。

### 修改输出文件名格式

如需修改输出文件名格式，可以修改 `index.js` 文件中的以下代码：

```javascript
const outputFile = path.join(__dirname, `${path.basename(markdownFile, '.md')}_local.md`);
```

## 注意事项

1. **网络连接**：确保运行环境有网络连接，以便下载图片
2. **文件权限**：确保程序有写入文件和创建目录的权限
3. **图片版权**：请遵守图片的版权协议，合理使用下载的图片
4. **大文件处理**：对于包含大量图片的 Markdown 文件，处理时间会较长

## 许可证

MIT License

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址：<repository-url>
- 提交 Issue：<issues-url>

## 更新日志

### v1.0.0
- 初始版本发布
- 支持提取和下载 Markdown 中的在线图片
- 支持将图片路径更新为相对路径
- 生成新的 Markdown 文件
- 跨平台路径处理

---

**使用愉快！** 🚀