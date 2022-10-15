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

    async function grade(username, link)  {
        const browser = await puppeteer.launch()
        try {
            const page = await browser.newPage()
            page.setDefaultTimeout(30 * 1000)
            await page.goto(link)
            let grade = 0;
            const getElement = async (selector) => {
                return await page.evaluate(elementSelector => {
                    return document.querySelector(elementSelector);
                }, selector);
            }
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
            if(await  getElement("#btn__zuri")) {
                await Promise.all([
                    page.waitForNavigation(),
                    page.click('#btn__zuri'),
                ]);
                if(page.url().includes("training.zuri.team")){
                    grade += 20;
                    await page.goBack();
                }
            }
            if(await  getElement("#books")){
                await Promise.all([
                    page.waitForNavigation(),
                    page.click('#books'),
                ]);
                if(page.url().includes("books.zuri.team")){
                    grade += 20;
                    await page.goBack();
                }
            }

            if(grade >= 80){
                passed.push(username)
            }else {
                failed.push(username)
            }
        } catch (error) {
            console.error(error)
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