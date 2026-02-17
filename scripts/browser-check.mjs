import puppeteer from 'puppeteer';

const SCREENSHOTS_DIR = '/Users/kikubookair/ecxia-safety';

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. ログインページを開く
  console.log('=== Step 1: Opening login page ===');
  await page.goto('https://ecxia-safety.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-01-login.png` });
  console.log('Login page loaded');

  // 2. ログインする
  console.log('=== Step 2: Logging in ===');
  try {
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    const emailField = await page.$('input[type="email"], input[name="email"]');
    await emailField.click({ clickCount: 3 });
    await emailField.type('admin@ecxia.co.jp');
    const passField = await page.$('input[type="password"], input[name="password"]');
    await passField.click({ clickCount: 3 });
    await passField.type('uwOJUaDteuLL');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-02-filled.png` });

    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
    } else {
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('ログイン')) { btn.click(); break; }
        }
      });
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-03-dashboard.png` });
    console.log('Dashboard loaded. URL:', page.url());

    // サイドバーのメニュー項目を確認
    const sidebarLinks = await page.$$eval('a', links =>
      links.map(a => ({ href: a.href, text: a.textContent.trim() }))
    );
    console.log('Sidebar links:', JSON.stringify(sidebarLinks, null, 2));
  } catch (e) {
    console.error('Login error:', e.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-02-error.png` });
  }

  // 3. ドライバー管理ページへSPA内ナビゲーション（サイドバークリック）
  console.log('=== Step 3: Navigating to Drivers page via sidebar ===');
  try {
    await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.includes('ドライバー管理')) { link.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-04-drivers.png` });
    console.log('Drivers page loaded. URL:', page.url());

    // LINE連携ボタンがあるか確認
    const linkButtons = await page.$$eval('button', buttons =>
      buttons.filter(b => b.textContent.includes('LINE連携')).map(b => b.textContent.trim())
    );
    console.log('LINE連携 buttons found:', linkButtons.length, linkButtons);

    // 最初のLINE連携ボタンをクリック
    if (linkButtons.length > 0) {
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('LINE連携')) { btn.click(); break; }
        }
      });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-05-driver-line-dialog.png` });
      console.log('Driver LINE dialog opened');

      // ダイアログを閉じる
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) {
    console.error('Drivers page error:', e.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-04-error.png` });
  }

  // 4. スタッフ管理ページへSPA内ナビゲーション（サイドバークリック）
  console.log('=== Step 4: Navigating to Admin Users page via sidebar ===');
  try {
    const hasStaffLink = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.includes('スタッフ管理')) { link.click(); return true; }
      }
      return false;
    });

    if (!hasStaffLink) {
      console.log('WARNING: スタッフ管理 link NOT found in sidebar!');
      // サイドバーの全リンクを表示
      const allLinks = await page.$$eval('a', links =>
        links.map(a => ({ href: a.href, text: a.textContent.trim() }))
      );
      console.log('Available links:', JSON.stringify(allLinks));
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-06-no-link.png` });
    } else {
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-06-admin-users.png` });
      console.log('Admin Users page loaded. URL:', page.url());

      // LINE連携ボタンがあるか確認
      const adminLinkButtons = await page.$$eval('button', buttons =>
        buttons.filter(b => b.textContent.includes('LINE連携')).map(b => b.textContent.trim())
      );
      console.log('Admin LINE連携 buttons found:', adminLinkButtons.length, adminLinkButtons);

      // LINE連携ボタンをクリック
      if (adminLinkButtons.length > 0) {
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent.includes('LINE連携')) { btn.click(); break; }
          }
        });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-07-admin-line-dialog.png` });
        console.log('Admin LINE dialog opened');
      }
    }
  } catch (e) {
    console.error('Admin Users page error:', e.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-06-error.png` });
  }

  // 5. LINE自動配信設定ページへSPA内ナビゲーション
  console.log('=== Step 5: Navigating to Notification Settings via sidebar ===');
  try {
    const hasNotifLink = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.includes('LINE自動配信')) { link.click(); return true; }
      }
      return false;
    });

    if (!hasNotifLink) {
      console.log('WARNING: LINE自動配信 link NOT found in sidebar!');
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-08-no-link.png` });
    } else {
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/check-08-notification.png` });
      console.log('Notification Settings page loaded. URL:', page.url());
    }
  } catch (e) {
    console.error('Notification page error:', e.message);
  }

  await browser.close();
  console.log('\n=== All checks complete ===');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
