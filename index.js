require("./other/patchConsoleLog");
const config = require("./config");
const {plsParseArgs} = require("plsargs");
const Discord = require("discord.js");
const chillout = require("chillout");
const path = require("path");
const readdirRecursive = require("recursive-readdir");
const { makeSureFolderExists } = require("stuffs");
const Command = require("./types/Command");
const client = new Discord.Client(config.clientOptions);
require('discord-buttons')(client);

globalThis.Underline = {
  commands: new Discord.Collection(),
  events: new Discord.Collection(),
  config,
  client,
  Command: require("./types/Command"),
  Event: require("./types/Event")
}

console.info("[BİLGİ] Basit Altyapı - by Kıraç Armağan Önal");
(async () => {
  let commandsPath = path.resolve("./commands");
  await makeSureFolderExists(commandsPath);
  let eventsPath = path.resolve("./events");
  await makeSureFolderExists(eventsPath);

  config.onBeforeLoad(client);

  let loadStart = Date.now();
  let commandFiles = await readdirRecursive(commandsPath);

  commandFiles = commandFiles.filter(i => {
    let state = path.basename(i).startsWith("-");
    if (state) console.warn(`[UYARI] "${i}" dosyası tire ile başladığı için liste dışı bırakıldı.`);
    return !state;
  });

  await chillout.forEach(commandFiles, (commandFile) => {
    let start = Date.now();
    console.info(`[BİLGİ] "${commandFile}" komut yükleniyor..`)
    /** @type {import("./types/Command")} */
    let command = require(commandFile);

    if (command?._type != "command") {
      console.warn(`[UYARI] "${commandFile}" komut dosyası boş. Atlanıyor..`);
      return;
    }

    if (typeof command.name != "string") command.name = path.basename(commandFile).slice(0, -3).replace(/ /g, "");
    if (!command.aliases.includes(command.name) && config.addCommandNameAsAlias) command.aliases.unshift(command.name);

    if (command.aliases.length == 0) {
      console.warn(`[UYARI] "${command.name}" adlı bir komut için hiç bir yanad(alias) tanımlanmamış. Atlanıyor..`);
      return;
    }

    if (Underline.commands.has(command.name)) {
      console.warn(`[UYARI] "${command.name}" adlı bir komut daha önceden zaten yüklenmiş. Atlanıyor.`)
      return;
    }

    if (typeof command.onCommand != "function") {
      console.error(`[HATA] "${command.name}" adlı komut geçerli bir onCommand fonksiyonuna sahip değil! Atlanıyor.`);
      return;
    };

    if (!command.guildOnly && (command.perms.bot.length != 0 || command.perms.user.length != 0)) {
      console.warn(`[UYARI] "${command.name}" adlı komut sunuculara özel olmamasına rağmen özel perm kullanıyor.`);
    }

    Underline.commands.set(command.name, command);
    command.onLoad(client);
    console.info(`[BİLGİ] "${command.name}" adlı komut yüklendi. (${Date.now() - start}ms sürdü.)`);
  });

  if (Underline.commands.size) {
    console.info(`[BİLGİ] ${Underline.commands.size} komut yüklendi.`);
  } else {
    console.warn(`[UYARI] Hiçbir komut yüklenmedi, herşey yolunda mı?`);
  }

  let eventFiles = await readdirRecursive(eventsPath);

  eventFiles = eventFiles.filter(i => {
    let state = path.basename(i).startsWith("-");
    if (state) console.warn(`[UYARI] "${i}" dosyası tire ile başladığı için liste dışı bırakıldı.`);
    return !state;
  });

  await chillout.forEach(eventFiles, async (eventFile) => {
    let start = Date.now();
    console.info(`[BİLGİ] "${eventFile}" event yükleniyor..`);

    /** @type {import("./types/Event")} */
    let event = require(eventFile);

    if (event?._type != "event") {
      console.warn(`[UYARI] "${eventFile}" event dosyası boş. Atlanıyor..`);
      return;
    }

    if (typeof event.name != "string") event.name = path.basename(eventFile).slice(0, -3).replace(/ /g, "");

    if (Underline.events.has(event.name)) {
      console.warn(`[UYARI] "${event.name}" adlı bir event daha önceden zaten yüklenmiş. Atlanıyor.`);
      return;
    }

    if (typeof event.onEvent != "function") {
      console.error(`[HATA] "${event.name}" adlı event geçerli bir onEvent fonksiyonuna sahip değil! Atlanıyor.`);
      return;
    };

    Underline.events.set(event.name, event);
    event.onLoad(client);
    console.info(`[BİLGİ] "${event.name}" adlı event yüklendi. (${Date.now() - start}ms sürdü.)`);
  })

  if (Underline.events.size) {
    console.info(`[BİLGİ] ${Underline.events.size} event yüklendi.`);
  } else {
    console.warn(`[UYARI] Hiçbir event yüklenmedi, herşey yolunda mı?`);
  }

  client.on("message", async (message) => {
    if (message.author.id == client.user.id) return;

    let usedPrefix = "";
    let usedAlias = "";
    let content = message.content;
    
    await chillout.forEach(config.prefixes, (p) => {
      if (content.slice(0, p.length).toLowerCase() == p.toLowerCase()) {
        usedPrefix = p;
        usedAlias = content.slice(p.length).trim().split(" ", 2)[0];
        return chillout.StopIteration;
      }
    });

    if (!usedPrefix || !usedAlias) return;
    let lowerUsedAlias = usedAlias.toLowerCase();
    let args = content.trim().split(" ");
    if (args[0] == usedPrefix) {
      args.shift();
      args[0] = `${usedPrefix}${usedAlias}`;
    }
    let plsargs = plsParseArgs(args);

    chillout.forEach(
      Underline.commands.array(),
      /**
       * @param {Command} command
       */
      async (command) => {
        if (!command.aliases.some(i => i.toLowerCase() == lowerUsedAlias)) return;

        let shouldRun1 = await config.onCommandBeforeChecks(command, message);
        if (!shouldRun1) return chillout.StopIteration;

        if (command.disabled) {
          config.userErrors.disabled(message, command);
          return chillout.StopIteration;
        }
        
        if (command.developerOnly && !config.developers.has(message.author.id)) {
          config.userErrors.developerOnly(message, command);
          return chillout.StopIteration;
        }

        if (config.blockedUsers.has(message.author.id)) {
          config.userErrors.blocked(message, command);
          return chillout.StopIteration;
        }

        if (command.guildOnly && message.channel.type == "dm") {
          config.userErrors.guildOnly(message, command);
          return chillout.StopIteration;
        }

        let userCooldown = command.coolDowns.get(message.author.id) || 0;
        if (Date.now() < userCooldown) {
          config.userErrors.coolDown(message, command, userCooldown - Date.now());
          return chillout.StopIteration;
        }

        function setCoolDown(duration = 0) {
          if (typeof duration == "number" && duration > 0) {
            return command.coolDowns.set(message.author.id, Date.now() + duration);
          } else {
            return command.coolDowns.delete(message.author.id);
          }
        }

        let other = {
          args, plsargs, usedPrefix, usedAlias, setCoolDown
        };

        if (command.coolDown > 0) {
          setCoolDown(command.coolDown);
        }

        if (command.guildOnly && command.perms.bot.length != 0 && !command.perms.bot.every(perm => message.guild.me.permissions.has(perm))) {
          config.userErrors.botPermsRequired(message, command, command.perms.bot);
          return chillout.StopIteration;
        }

        if (command.guildOnly && command.perms.user.length != 0 && !command.perms.user.every(perm => message.member.permissions.has(perm))) {
          config.userErrors.userPermsRequired(message, command, command.perms.user);
          return chillout.StopIteration;
        }


        (async () => {
          let shouldRun2 = await config.onCommand(command, message, other);
          if (!shouldRun2) return;
          await command.onCommand(message, other);
        })();

        return chillout.StopIteration;
      }
    );
  })

  {
    /** @type {Map<string, (import("./types/Event"))[]>} */
    let eventsMapped = Underline.events.array().reduce((all, cur) => {
      if (!all.has(cur.eventName)) all.set(cur.eventName, []);
      all.get(cur.eventName).push(cur);
      return all;
    }, new Map());

    await chillout.forEach(
      Array.from(eventsMapped.entries()),
      /**
       * @param {[string, (import("./types/Event"))[]>]} param0
       */
      ([eventName, events]) => {
        console.info(`[BİLGİ] Event "${eventName}" için ${events.length} dinleyici yüklendi!`);
        client.on(eventName, (...args) => {
          setTimeout(() => {
            chillout.forEach(events, (event) => {
              if (!event.disabled) {
                event.onEvent(...args);
              }
            });
          },0)
        });
      }
    )
  }

  console.info(`[BİLGİ] Herşey ${Date.now() - loadStart}ms içerisinde yüklendi!`);

  commandFiles = 0;
  eventFiles = 0;
  loadStart = 0;

  config.onAfterLoad(client);

  await client.login(config.clientToken);
  console.info("[BİLGİ] Discord'a bağlanıldı!", client.user.tag);
  config.onReady(client);
})();



