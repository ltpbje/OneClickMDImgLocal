// 导入文件系统模块，用于文件读写操作
const fs = require('fs');
// 导入路径模块，用于处理文件路径
const path = require('path');
// 导入axios模块，用于发送HTTP请求下载图片
const axios = require('axios');
// 导入readline模块，用于交互式命令行输入
const readline = require('readline');

/**
 * 从Markdown内容中提取所有网络图片
 * @param {string} markdownContent - Markdown文件的完整内容
 * @returns {Array} 包含图片信息的对象数组
 * @description 使用正则表达式匹配Markdown中的图片语法，提取网络图片的URL、alt文本和完整匹配内容
 */
function extractNetworkImages(markdownContent) {
    // 正则表达式：匹配Markdown图片语法 ![alt](url)，其中url必须是http或https开头的网络地址
    const imageRegex = /!\[(.*?)\]\((https?:\/\/.*?)\)/g;
    // 用于存储提取到的图片信息
    const networkImages = [];
    let match;

    // 循环匹配所有符合条件的图片
    while ((match = imageRegex.exec(markdownContent)) !== null) {
        // 将匹配到的图片信息添加到数组中
        networkImages.push({
            fullMatch: match[0],  // 完整的图片Markdown语法（例如：![alt](url)）
            alt: match[1],         // 图片的alt文本
            url: match[2]          // 图片的网络URL地址
        });
    }

    // 返回提取到的所有网络图片信息
    return networkImages;
}

/**
 * 下载网络图片并保存到本地
 * @param {string} url - 图片URL地址
 * @param {string} savePath - 图片保存的完整路径
 * @returns {Promise<string>} 相对于Markdown文件的图片相对路径
 * @description 下载网络图片，保存到指定路径，并返回相对路径用于替换Markdown中的图片链接
 */
async function downloadImage(url, savePath) {
    try {
        // 发送HTTP GET请求下载图片，设置响应类型为arraybuffer
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // 将响应数据转换为Buffer对象
        const imageBuffer = Buffer.from(response.data);

        // 确保图片保存目录存在，如果不存在则创建
        const dirPath = path.dirname(savePath);
        if (!fs.existsSync(dirPath)) {
            // 递归创建目录，包括所有父目录
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // 将图片Buffer写入到指定路径的文件中
        fs.writeFileSync(savePath, imageBuffer);
        console.log(`下载成功: ${url} -> ${savePath}`);

        // 计算图片相对于Markdown文件的相对路径
        // 从savePath中提取assets目录的父目录，即Markdown文件所在目录
        // 例如：savePath = 'd:/some/path/assets/image.jpg'，则assetsParentDir = 'd:/some/path'
        const assetsParentDir = path.dirname(path.dirname(savePath));
        // 计算图片相对于assets父目录的相对路径
        const relativePath = path.relative(assetsParentDir, savePath).replace(/\\/g, '/');
        // 确保相对路径以'./'开头，符合Markdown语法规范
        return relativePath.startsWith('./') ? relativePath : `./${relativePath}`;
    } catch (error) {
        // 捕获并显示下载错误
        console.error(`下载失败 ${url}:`, error.message);
        // 重新抛出错误，让调用者处理
        throw error;
    }
}

/**
 * 将Markdown内容中的网络图片URL替换为本地图片相对路径
 * @param {string} markdownContent - 原始Markdown内容
 * @param {Array} images - 图片信息数组，包含图片的fullMatch、alt和url
 * @param {Object} localMap - 图片URL到本地相对路径的映射对象
 * @returns {string} 替换后的Markdown内容
 * @description 遍历所有图片，将Markdown中的网络图片链接替换为本地路径
 */
function replaceImagesWithLocal(markdownContent, images, localMap) {
    // 初始化结果为原始Markdown内容
    let result = markdownContent;

    // 遍历所有提取到的图片
    images.forEach(image => {
        // 检查是否成功生成了本地路径
        if (localMap[image.url]) {
            // 原始图片Markdown语法（例如：![alt](url)）
            const oldMark = image.fullMatch;
            // 新的图片Markdown语法，使用本地路径（例如：![alt](./assets/xxx.jpg)）
            const newMark = `![${image.alt}](${localMap[image.url]})`;
            // 替换原始内容中的图片链接
            result = result.replace(oldMark, newMark);
        }
    });

    // 返回替换后的Markdown内容
    return result;
}

/**
 * 主函数 - 程序的入口点
 * @param {string} markdownFile - Markdown文件路径
 * @description 读取Markdown文件，提取网络图片，下载到本地assets目录，
 *              并生成一个新的Markdown文件，其中图片路径替换为本地路径
 */
async function main(markdownFile) {
    try {
        // 读取Markdown文件内容
        const markdownContent = fs.readFileSync(markdownFile, 'utf8');
        console.log('读取文件成功:', markdownFile);

        // 从Markdown内容中提取所有网络图片
        const networkImages = extractNetworkImages(markdownContent);
        console.log(`找到 ${networkImages.length} 张网络图片`);

        // 如果没有找到网络图片，直接返回
        if (networkImages.length === 0) {
            console.log('没有网络图片需要转换');
            return;
        }

        // 用于存储图片URL到本地路径的映射关系
        const localMap = {};
        // 获取原始Markdown文件所在的目录
        const inputDir = path.dirname(markdownFile);

        // 遍历所有网络图片，下载并生成本地路径
        for (const image of networkImages) {
            console.log(`处理图片: ${image.url}`);
            try {
                // 生成唯一的文件名，避免重复
                const fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${getImageExtension(image.url)}`;
                // 构建完整的图片保存路径 (原始文件目录/assets/文件名)
                const savePath = path.join(inputDir, 'assets', fileName);
                // 下载图片并获取相对路径
                const localPath = await downloadImage(image.url, savePath);
                // 存储URL到本地路径的映射
                localMap[image.url] = localPath;
                console.log(`转换成功: ${localPath}`);
            } catch (error) {
                console.error(`转换失败: ${error.message}`);
                // 如果下载失败，保留原始URL
                localMap[image.url] = image.url;
            }
        }

        // 使用本地路径替换Markdown中的网络图片URL
        const updatedContent = replaceImagesWithLocal(markdownContent, networkImages, localMap);

        // 生成输出文件名，格式为: 原文件名_local.md
        const outputFile = path.join(inputDir, `${path.basename(markdownFile, '.md')}_local.md`);

        // 将修改后的内容写入新文件
        fs.writeFileSync(outputFile, updatedContent, 'utf8');
        console.log('文件更新成功:', outputFile);
        console.log(`成功转换 ${Object.keys(localMap).length} 张图片`);

    } catch (error) {
        // 捕获并显示所有错误
        console.error('执行失败:', error);
    }
}

/**
 * 从URL中获取图片扩展名
 * @param {string} url - 图片URL
 * @returns {string} 图片扩展名，如jpg、png等
 * @description 从图片URL中提取文件扩展名，如果无法提取则默认返回jpg
 */
function getImageExtension(url) {
    // 使用正则表达式匹配URL中的文件扩展名
    const match = url.match(/\.(\w+)(\?|$)/);
    // 如果匹配成功则返回扩展名，否则返回默认扩展名jpg
    return match ? match[1] : 'jpg';
}

// 命令行参数处理部分
// 获取命令行参数，忽略前两个默认参数(node和脚本路径)
const args = process.argv.slice(2);

// 如果提供了一个命令行参数，则直接使用该参数作为Markdown文件路径
if (args.length === 1) {
    const markdownFile = args[0];
    main(markdownFile);
} else {
    // 如果没有提供命令行参数或参数数量不正确，则进入交互式模式
    console.log('未提供Markdown文件路径，进入交互式模式');

    // 创建readline接口，用于读取用户输入
    const rl = readline.createInterface({
        input: process.stdin,   // 输入流为标准输入
        output: process.stdout  // 输出流为标准输出
    });

    // 向用户提问，获取Markdown文件路径
    rl.question('请输入Markdown文件路径: ', (markdownFile) => {
        rl.close();  // 关闭readline接口
        main(markdownFile);  // 调用主函数处理用户输入的文件路径
    });
}