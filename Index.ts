import { Builder, By } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { MongoClient } from 'mongodb';

(async () => {
  try {
    // rodando pelo docker, temos um leve probleminha de nao identificar quando o
    //selenium está de pé, entao esperamos ele subir para continuar
    console.log('Inicializando Aplicação... Aguardando Selenium Server.')
    await new Promise(resolve => setTimeout(resolve, 3000));
    //   const connection = await MongoClient.connect('mongodb://localhost:27017');
    const connection = await MongoClient.connect(
      `mongodb://${process.env.MONGO_HOST || 'localhost'}:27017`,
    );
    const db = connection.db('marvel').collection('books');

    const builder = await new Builder();
    const options = new Options();
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
      //para pegar do DOCKER
      .usingServer(`http://${host}:${port}/wd/hub`)
      .setChromeOptions(options)
      .build();
    console.log('Buscando link...');
    await driver.get(
      'http://marvel.com/comics/list/623/get_started_with_free_issues?&options%5Boffset%5D=0&totalcount=45',
    );

    const list = await driver.findElement(By.id('comicsListing'));
    console.log('Obtendo lista de itens...');

    const items = await list.findElements(By.className('comic-item'));
    for (let i = 0; i <= items.length - 1; i++) {
      const item = items[i];
      const title = await item
        .findElement(By.className('meta-title'))
        .getText();
      console.log(`Extraindo informações de: ${title}`);
      const href = await item.findElement(By.className('see-inside'));
      const bookLink = await href.getAttribute('href');
      const result = await db.insert({ description: title, url: bookLink });
    }
    await driver.quit();
    const result = await db.find({}).toArray();
    console.log('Resultados', result);
  } catch (error) {
    console.error(error);
  }
})();
