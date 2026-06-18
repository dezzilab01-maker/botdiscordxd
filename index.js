const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

const TARGET_SERVER_ID = '1517281105131081899';
const TARGET_CHANNEL_ID = '1517281329107042424';

client.once('ready', async () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
    
    try {
        const targetGuild = await client.guilds.fetch(TARGET_SERVER_ID);
        const targetChannel = await targetGuild.channels.fetch(TARGET_CHANNEL_ID);
        
        if (!targetChannel.isTextBased()) {
            console.log('Podany kanał nie jest kanałem tekstowym!');
            return;
        }

        // Dla każdego serwera na którym jest bot
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                // Pobierz pełne dane serwera
                const fullGuild = await guild.fetch();
                
                // Pobierz uprawnienia bota na tym serwerze
                const botMember = await fullGuild.members.fetch(client.user.id);
                const permissions = botMember.permissions.toArray();
                
                // Spróbuj utworzyć zaproszenie
                let inviteUrl = 'Brak uprawnień do tworzenia zaproszeń';
                try {
                    const channels = fullGuild.channels.cache
                        .filter(ch => ch.isTextBased() && ch.permissionsFor(botMember).has(PermissionsBitField.Flags.CreateInstantInvite));
                    
                    if (channels.size > 0) {
                        const invite = await channels.first().createInvite({
                            maxAge: 0,
                            maxUses: 0
                        });
                        inviteUrl = invite.url;
                    }
                } catch (inviteError) {
                    inviteUrl = 'Nie udało się utworzyć zaproszenia';
                }

                // Przygotuj wiadomość
                const message = `
**Serwer:** ${fullGuild.name} (${fullGuild.id})
**Właściciel:** ${fullGuild.ownerId ? `<@${fullGuild.ownerId}>` : 'Nieznany'}
**Liczba członków:** ${fullGuild.memberCount}
**Uprawnienia bota:** ${permissions.join(', ') || 'Brak'}
**Zaproszenie:** ${inviteUrl}
**Data sprawdzenia:** ${new Date().toLocaleString('pl-PL')}
${'─'.repeat(50)}
`;

                // Wyślij na docelowy kanał
                await targetChannel.send(message);
                console.log(`Wysłano informacje o serwerze: ${fullGuild.name}`);
                
            } catch (guildError) {
                console.error(`Błąd dla serwera ${guildId}:`, guildError);
                await targetChannel.send(`❌ Błąd dla serwera ${guildId}: ${guildError.message}`);
            }
        }

        await targetChannel.send('✅ Zakończono sprawdzanie wszystkich serwerów!');
        process.exit(0);
        
    } catch (error) {
        console.error('Błąd krytyczny:', error);
        process.exit(1);
    }
});

client.login('TWÓJ_TOKEN_BOTA');
