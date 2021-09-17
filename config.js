module.exports = new (require("./types/Config"))({
  // Liste haline bot için kullanılacak ön-ek/preifxler
  prefixes: ["-"],
  // E tabi, bot tokeni buraya.
  clientToken: "token",
  // Yasaklı kullanıcıların idleri.
  blockedUsers: new Set([

  ]),
  // Geliştiricilerin idleri.
  developers: new Set([
    "544567870776934431"
  ]),
  // Discord.js client ayarları.
  clientOptions: {},
  // Kullanıcı hatalarındaki uyarı mesajları/olayları.
  userErrors: {
    // Arka arkaya komut kullanma limiti aşıldığında.
    coolDown(message, command, coolDown) {
      message
        .reply(
          `You can use this command again in ${(coolDown / 1000).toFixed(
            2
          )} seconds.`
        )
        .then((m) => m.delete({ timeout: 5000 }));
      message.react("⏳");
    },
    // Komut kapalı olduğunda
    disabled(message, command) {
      message.react("⭕");
    },
    // Kullanıcı bottan yasaklı olduğunda.
    blocked(message, command) {
      message.react("💥");
    },
    // Botun çalışmak için x yertkilerine ihtiyacı olduğunda.
    botPermsRequired(message, command, perms) {
      message
        .reply(
          `I need ${perms.join(", ")} permissions for this command to work.`
        )
        .then((m) => m.delete({ timeout: 10000 }));
    },
    // Kullanıcının komutu kullanabilmek için x yetkilerine ihtiyacı olduğunda.
    userPermsRequired(message, command, perms) {
      message
        .reply(
          `You need ${perms.join(", ")} permissions for this command to work.`
        )
        .then((m) => m.delete({ timeout: 10000 }));
    },
    // Komut sadece geliştiricilere özel olduğunda.
    developerOnly(message, command) {
      message
        .reply(`Only bot developers can use this command.`)
        .then((m) => m.delete({ timeout: 5000 }));
    },
    // Sunuculara özel olan bir komutu dm'den kullanılmaya çalıştığı zaman.
    guildOnly(message, command) {
      message
        .reply(`This command can only be used on servers.`)
        .then((m) => m.delete({ timeout: 5000 }));
    },
  },
  // Diğer ayarlar. Bunun içine ne isterseniz koyabilirsiniz.
  // Ulaşmak için "Underline.config.other" objesini kullanabilirsiniz.
  other: {},
  // Komut ismini otomatik olarak aliasların içine
  // eklersin mi? Varsayılan true.
  addCommandNameAsAlias: true,
  // Her komutun varsayılan ayarları her anahtarın ne
  // işe yaradığını merak ediyorsanız commands/ornekKomut.js'e
  // bakabilirsiniz.
  commandDefaults: {
    desc: "",
    develoeOnly: false,
    disabled: false,
    coolDown: 0,
    guildOnly: true,
    other: {
      usage: "{p}{alias}"
    },
    perms: {
      bot: [],
      user: []
    }
  },
  // Bot ilk açıldığında daha hiçbirşey yüklenmeden önce çalışan fonksiyon. Opsiyonel.
  onBeforeLoad(client) {
    console.log("[CONFIG] Yüklemeye başlamadan önce çalıştı.");
  },
  // Bot komutları ve olayları yükledikten sonra çalışan fonksiyon. Opsiyonel.
  onAfterLoad(client) {
    console.log("[CONFIG] Yükleme bittikten sonra çalıştı.");
  },
  // Bot açıldıktan sonra kullanıma hazır olduktan sonra çalışan fonksiyon. Opsiyonel.
  onReady(client) {
    console.log("[CONFIG] Discord hesabına giriş yaptıktan sonra çalıştı.");
    client.user.setActivity(`${this.prefixes[0]}help`, {type: "WATCHING"})
  },
  // Komut üzerinde hiçbir kontrol yapılmadan önce çalışır.
  // Sadece cevap true ise işleme devam eder.
  async onCommandBeforeChecks(command, message) {
    return true;
  },
  // Komuttaki bütün kontrolleri geçtikten sonra, komut
  // hemen çalıştırılmadan önce çalışır.
  // Sadece cevap true ise işleme devam eder.
  //
  // Other objesini istediğiniz gibi modifiye edebilirsiniz. Bunu middleware gibi düşünebilirsiniz.
  // Nasılsa altakki fonksiyon her komut çalışmadan önce çalışır.
  async onCommand(command, message, other) {
    return true;
  }
})