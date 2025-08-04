/**
 * TelegramGroup组件测试脚本
 * 用于验证组件的基本功能
 */

const puppeteer = require('puppeteer');

async function testTelegramGroup() {
  console.log('🧪 开始测试TelegramGroup组件...');
  
  let browser;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: false, // 显示浏览器窗口
      devtools: true,  // 打开开发者工具
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📱 访问测试页面...');
    await page.goto('http://localhost:50111/todo-for-ai/pages/test-telegram', {
      waitUntil: 'networkidle2'
    });
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    console.log('🔍 检查页面标题...');
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 测试1: 检查当前语言
    console.log('\n📋 测试1: 检查当前语言设置');
    const currentLanguage = await page.evaluate(() => {
      const langElement = document.querySelector('[data-testid="current-language"]');
      return langElement ? langElement.textContent : 'unknown';
    });
    console.log(`当前语言: ${currentLanguage}`);
    
    // 测试2: 切换到英文模式
    console.log('\n📋 测试2: 切换到英文模式');
    const englishButton = await page.$('button:contains("English")');
    if (englishButton) {
      await englishButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 已切换到英文模式');
    } else {
      console.log('❌ 未找到英文切换按钮');
    }
    
    // 测试3: 检查TelegramGroup组件是否显示
    console.log('\n📋 测试3: 检查TelegramGroup组件');
    const telegramWidget = await page.$('.telegram-group-widget');
    if (telegramWidget) {
      console.log('✅ TelegramGroup组件已显示');
      
      // 检查组件文本
      const buttonText = await page.evaluate(() => {
        const textElement = document.querySelector('.telegram-group-text');
        return textElement ? textElement.textContent : null;
      });
      console.log(`按钮文本: ${buttonText}`);
      
      // 测试悬停效果
      console.log('\n📋 测试4: 测试悬停效果');
      await page.hover('.telegram-group-icon');
      await page.waitForTimeout(500);
      
      const popup = await page.$('.telegram-group-popup');
      if (popup) {
        console.log('✅ 悬停弹窗已显示');
        
        // 检查弹窗内容
        const popupTitle = await page.evaluate(() => {
          const titleElement = document.querySelector('.popup-header h4');
          return titleElement ? titleElement.textContent : null;
        });
        console.log(`弹窗标题: ${popupTitle}`);
        
        const description = await page.evaluate(() => {
          const descElement = document.querySelector('.telegram-description');
          return descElement ? descElement.textContent : null;
        });
        console.log(`描述文本: ${description}`);
        
      } else {
        console.log('❌ 悬停弹窗未显示');
      }
      
    } else {
      console.log('❌ TelegramGroup组件未显示');
    }
    
    // 测试5: 切换到中文模式
    console.log('\n📋 测试5: 切换到中文模式');
    const chineseButton = await page.$('button:contains("中文")');
    if (chineseButton) {
      await chineseButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 已切换到中文模式');
      
      // 检查TelegramGroup是否隐藏
      const telegramWidgetAfterSwitch = await page.$('.telegram-group-widget');
      if (!telegramWidgetAfterSwitch) {
        console.log('✅ TelegramGroup组件已隐藏（符合预期）');
      } else {
        console.log('❌ TelegramGroup组件仍然显示（不符合预期）');
      }
      
      // 检查WeChatGroup是否显示
      const wechatWidget = await page.$('.wechat-group-widget');
      if (wechatWidget) {
        console.log('✅ WeChatGroup组件已显示');
      } else {
        console.log('❌ WeChatGroup组件未显示');
      }
      
    } else {
      console.log('❌ 未找到中文切换按钮');
    }
    
    console.log('\n🎉 测试完成！');
    
    // 保持浏览器打开以便手动检查
    console.log('浏览器将保持打开状态，请手动检查结果...');
    await page.waitForTimeout(30000); // 等待30秒
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行测试
testTelegramGroup().catch(console.error);
