// Script de prueba directo para OpenAI
// Ejecutar con: node test-openai-direct.js

const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.OPENAI_API_KEY;

console.log('\n🔍 DIAGNÓSTICO OPENAI API KEY\n');
console.log('1. API Key presente:', !!apiKey);
console.log('2. API Key formato:', apiKey ? 
  (apiKey.startsWith('sk-proj-') ? '✅ Formato nuevo (sk-proj-)' : 
   apiKey.startsWith('sk-') ? '⚠️ Formato antiguo (sk-)' : 
   '❌ Formato inválido') : 'N/A');
console.log('3. API Key longitud:', apiKey ? apiKey.length : 0);
console.log('4. Primeros 15 chars:', apiKey ? apiKey.substring(0, 15) + '...' : 'N/A');
console.log('5. Últimos 8 chars:', apiKey ? '...' + apiKey.substring(apiKey.length - 8) : 'N/A');
console.log('\n');

if (!apiKey) {
  console.error('❌ ERROR: OPENAI_API_KEY no encontrada en .env.local');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

console.log('🧪 Probando conexión con OpenAI...\n');

async function testOpenAI() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Responde solo con OK" },
        { role: "user", content: "Test" }
      ],
      max_tokens: 10,
      temperature: 0,
    });

    console.log('✅ ÉXITO: Conexión establecida correctamente\n');
    console.log('Respuesta de OpenAI:', completion.choices[0].message.content);
    console.log('Modelo usado:', completion.model);
    console.log('Tokens usados:', completion.usage);
    console.log('\n✅ Tu API key funciona perfectamente!\n');
    
  } catch (error) {
    console.error('❌ ERROR en conexión con OpenAI:\n');
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('\n');
    
    if (error.status === 401) {
      console.error('🔧 SOLUCIÓN: API Key inválida o revocada');
      console.error('1. Ve a https://platform.openai.com/api-keys');
      console.error('2. Elimina la key antigua');
      console.error('3. Crea una NUEVA key');
      console.error('4. Cópiala COMPLETA');
      console.error('5. Pégala en .env.local\n');
    } else if (error.status === 403) {
      console.error('🔧 SOLUCIÓN: Sin acceso a modelos');
      console.error('1. Ve a https://platform.openai.com/settings/organization/billing');
      console.error('2. Verifica balance > $0');
      console.error('3. Espera 5 minutos para que se actualice');
      console.error('4. Intenta de nuevo\n');
    } else if (error.status === 429) {
      console.error('🔧 SOLUCIÓN: Rate limit excedido');
      console.error('Espera 60 segundos e intenta nuevamente\n');
    }
    
    process.exit(1);
  }
}

testOpenAI();