"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = require("selenium-webdriver/chrome");
const mongodb_1 = require("mongodb");
(async () => {
    try {
        // rodando pelo docker, temos um leve probleminha de nao identificar quando o
        //selenium está de pé, entao esperamos ele subir para continuar
        await new Promise(resolve => setTimeout(resolve, 3000));
        //   const connection = await MongoClient.connect('mongodb://localhost:27017');
        const connection = await mongodb_1.MongoClient.connect(`mongodb://${process.env.MONGO_HOST || 'localhost'}:27017`);
        const db = connection.db('marvel').collection('books');
        const builder = await new selenium_webdriver_1.Builder();
        const options = new chrome_1.Options();
        // para rodar de modo invisivel
        options.addArguments('headless');
        // modo anonimo
        options.addArguments('--incognito');
        // caso rodar o projeto via Docker, ele irá pegar as variaveis de ambiente
        // direto de lá. se não, vai pegar da sua maquina.
        const host = process.env.SELENIUM_HOST || 'localhost';
        const port = process.env.SELENIUM_PORT || '4444';
        const driver = builder
            .forBrowser('chrome')
            .usingServer(`http://${host}:${port}/wd/hub`)
            .setChromeOptions(options)
            .build();
        console.log('Buscando link...');
        await driver.get('http://marvel.com/comics/list/623/get_started_with_free_issues?&options%5Boffset%5D=0&totalcount=45');
        const list = await driver.findElement(selenium_webdriver_1.By.id('comicsListing'));
        console.log('Obtendo lista de itens...');
        const items = await list.findElements(selenium_webdriver_1.By.className('comic-item'));
        for (let i = 0; i <= items.length - 1; i++) {
            const item = items[i];
            const title = await item
                .findElement(selenium_webdriver_1.By.className('meta-title'))
                .getText();
            console.log(`Extraindo informações de: ${title}`);
            const href = await item.findElement(selenium_webdriver_1.By.className('see-inside'));
            const bookLink = await href.getAttribute('href');
            const result = await db.insert({ description: title, url: bookLink });
        }
        await driver.quit();
        const result = await db.find({}).toArray();
        console.log('Resultados', result);
    }
    catch (error) {
        console.error(error);
    }
})();
//# sourceMappingURL=Index.js.map