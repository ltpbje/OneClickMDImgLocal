const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

/**
 * 从Markdown文件中提取网络图片
 * @param {string} markdownContent - Markdown文件内容
 * @returns {Array} 网络图片信息数组
 */
function extractNetworkImages(markdownContent) {
    const imageRegex = /!\[(.*?)\]\((https?:\/\/.*?)\)/g;
    const networkImages = [];
    let match;

    while ((match = imageRegex.exec(markdownContent)) !== null) {
        networkImages.push({
            fullMatch: match[0],
            alt: match[1],
            url: match[2]
        });
    }

    return networkImages;
}

/**
 * 下载网络图片
 * @param {string} url - 图片URL
 * @param {string} savePath - 保存路径
 * @returns {Promise<string>} 保存后的相对路径
 */
async function downloadImage(url, savePath) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // 确保目录存在
        const dirPath = path.dirname(savePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // 写入文件
        fs.writeFileSync(savePath, imageBuffer);
        console.log(`下载成功: ${url} -> ${savePath}`);

        // 返回以 './assets' 开头的相对路径，使用正斜杠作为分隔符
        const relativePath = path.relative(path.dirname(process.argv[2] || __dirname), savePath).replace(/\\/g, '/');
        // 确保路径以 './' 开头
        return relativePath.startsWith('./') ? relativePath : `./${relativePath}`;
    } catch (error) {
        console.error(`下载失败 ${url}:`, error.message);
        throw error;
    }
}

/**
 * 替换Markdown中的网络图片为本地图片
 * @param {string} markdownContent - 原始Markdown内容
 * @param {Array} images - 图片信息数组
 * @param {Object} localMap - 图片URL到本地路径的映射
 * @returns {string} 替换后的Markdown内容
 */
function replaceImagesWithLocal(markdownContent, images, localMap) {
    let result = markdownContent;

    images.forEach(image => {
        if (localMap[image.url]) {
            const oldMark = image.fullMatch;
            const newMark = `![${image.alt}](${localMap[image.url]})`;
            result = result.replace(oldMark, newMark);
        }
    });

    return result;
}

/**
 * 主函数
 * @param {string} markdownFile - Markdown文件路径
 */
async function main(markdownFile) {
    try {
        // 读取Markdown文件
        const markdownContent = fs.readFileSync(markdownFile, 'utf8');
        console.log('读取文件成功:', markdownFile);

        // 提取网络图片
        const networkImages = extractNetworkImages(markdownContent);
        console.log(`找到 ${networkImages.length} 张网络图片`);

        if (networkImages.length === 0) {
            console.log('没有网络图片需要转换');
            return;
        }

        // 下载图片并构建本地路径映射
        const localMap = {};
        for (const image of networkImages) {
            console.log(`处理图片: ${image.url}`);
            try {
                // 生成文件名
                const fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${getImageExtension(image.url)}`;
                const savePath = path.join(__dirname, 'assets', fileName);
                // 下载图片
                const localPath = await downloadImage(image.url, savePath);
                localMap[image.url] = localPath;
                console.log(`转换成功: ${localPath}`);
            } catch (error) {
                console.error(`转换失败: ${error.message}`);
                localMap[image.url] = image.url;
            }
        }

        // 替换图片为本地路径
        const updatedContent = replaceImagesWithLocal(markdownContent, networkImages, localMap);

        // 生成输出文件名
        const outputFile = path.join(__dirname, `${path.basename(markdownFile, '.md')}_local.md`);

        // 保存修改后的文件
        fs.writeFileSync(outputFile, updatedContent, 'utf8');
        console.log('文件更新成功:', outputFile);
        console.log(`成功转换 ${Object.keys(localMap).length} 张图片`);

    } catch (error) {
        console.error('执行失败:', error);
    }
}

/**
 * 从URL中获取图片扩展名
 * @param {string} url - 图片URL
 * @returns {string} 图片扩展名
 */
function getImageExtension(url) {
    const match = url.match(/\.(\w+)(\?|$)/);
    return match ? match[1] : 'jpg';
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length === 1) {
    const markdownFile = args[0];
    main(markdownFile);
} else {
    // 交互式输入
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('请输入Markdown文件路径: ', (markdownFile) => {
        rl.close();
        main(markdownFile);
    });
}