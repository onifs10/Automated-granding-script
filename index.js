const puppeteer = require('puppeteer')
const fs = require('fs');
const neatCSV = require('neat-csv')
const path = require('path')

const run = async () => {
    const submissionPath = path.join(__dirname, "/src/submissions.csv");
    const passedPath = path.join(__dirname, "/src/passed.csv");
    const failedPath = path.join(__dirname, "/src/failed.csv");
    const pendingPath = path.join(__dirname, "/src/pending.csv");
    const submissionsText = fs.readFileSync(submissionPath, 'utf8')
    const submissions = await neatCSV(submissionsText);
    const passed = []
    const failed = [];
    const pending = [];
    const minimal_args = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
    ];
    
    async function grade(username, link) {
        console.log(username,link)
        const browser = await puppeteer.launch({headless: true, args: minimal_args})
        try {
            const page = await browser.newPage()
            page.setDefaultTimeout(5 * 1000)
            await page.goto(link)
            await page.screenshot({path: path.join(__dirname, `/image/${username}.png`), type: "png", fullPage:true});
            let grade = 0;
            const getElement = async (selector) => {
                return await page.$(selector);
            };
            
            // Extract the results from the page.
            const profilePicture = await getElement("#profile__img");
            if(profilePicture){
                grade += 20;
            }
            const twitter = await getElement("#twitter");
            if(twitter){
                grade += 20;
            }
            const slackID = await getElement("#slack");
            if(slackID){
                grade += 20;
            }
            // click the zuri button
            if (await getElement("#btn__zuri")) {
                await page.click('#btn__zuri');
                grade += 10;
                try {
                    await Promise.all([
                        page.waitForNavigation(),
                        page.click('#btn__zuri'),
                    ]);
                    if (page.url().includes("training.zuri.team")) {
                        grade += 10;
                        await page.goBack();
                        // }
                    }
                } catch (e) {
                    // ignore error
                }
                
            }
                
            if (await getElement("#books")) {
                grade += 10;
                try {
                    await Promise.all([
                        page.waitForNavigation(),
                        page.click('#books'),
                    ]);
                    if (page.url().includes("books.zuri.team")) {
                        grade += 10;
                        await page.goBack();
                    }
                } catch (e) {
                    // igonre errror
                }
            }
            console.log(grade, username)
            if(grade >= 80){
                passed.push(username)
            }else {
                failed.push(username)
            }
        } catch (error) {
            console.log(error)
            pending.push({username, link})
        }
        await browser.close()
    }

    await Promise.all(submissions.map(submission => grade(submission.username, submission.link)))

    fs.writeFileSync(passedPath, passed.join("\n"), 'utf8')
    fs.writeFileSync(failedPath, failed.join("\n"),'utf8');
    fs.writeFileSync(pendingPath, `username,link\n ${pending.map((v) => `${v.username},${v.link}`).join("\n")}`,'utf8')
}

run().then(() => console.log("<============== done ===================>"));