import 'dotenv/config';
import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadRegistry, getDataset, deliveryMode } from '../../services/exams/config.js';
import { targetDate, normaliseRoll, validRoll } from '../../services/exams/normalise.js';
import { loadDataset } from '../../services/exams/source.js';
import { buildIndex, planRecipients } from '../../services/exams/schedule.js';
import { runReminder } from '../../services/exams/run.js';
import { prismaExamStore } from '../../services/exams/store.js';

const help = `Exam reminders (sending is OFF unless explicitly enabled):
  npm run exams:validate -- --dataset endsem-autumn-2026
  npm run exams:run -- --dataset endsem-autumn-2026 --date YYYY-MM-DD --dry-run [--fixture]
  npm run exams:run -- --dataset endsem-autumn-2026 --date YYYY-MM-DD --send [--test]
  npm run exams:audit -- --dataset endsem-autumn-2026 --all-dates [--fixture | --users-fixture users.json]
Options: --config path.json, --output private-directory, --help
--fixture uses ALL sheet enrolment rolls as a clearly labelled fake registered cohort.
--users-fixture reads an array of { id, rollNo, email }. Fixtures can NEVER be sent mail.`;

let prisma;
try {
    const { positionals, values } = parseArgs({ options: { dataset: { type: 'string' }, date: { type: 'string' }, config: { type: 'string' }, output: { type: 'string' }, send: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, test: { type: 'boolean' }, fixture: { type: 'boolean' }, 'users-fixture': { type: 'string' }, 'all-dates': { type: 'boolean' }, help: { type: 'boolean' } }, allowPositionals: true });
    const [command] = positionals;
    if (values.help) console.log(help);
    else {
        if (positionals.length !== 1 || !['validate', 'run', 'audit'].includes(command)) throw new Error(help);
        if (values.send && (command !== 'run' || values['dry-run'] || values.fixture || values['users-fixture'])) throw new Error('--send is only allowed for run, without --dry-run or fixture users');
        if (values.fixture && values['users-fixture']) throw new Error('Choose --fixture or --users-fixture, not both');
        const registry = await loadRegistry(values.config);
        const id = values.dataset || (registry.activeDatasets.length === 1 ? registry.activeDatasets[0] : null);
        if (!id) throw new Error('Specify --dataset when several datasets are active');
        const config = getDataset(registry, id);
        const mode = deliveryMode({ send: values.send, test: values.test });
        let store;
        if (process.env.POSTGRES_DATABASE_URL) {
            ({ default: prisma } = await import('../../config/db.js'));
            store = prismaExamStore(prisma);
        }
        if (values.send && !store) throw new Error('POSTGRES_DATABASE_URL must be configured before sending');
        let output;
        if (values.output) {
            output = resolve(values.output);
            await mkdir(output, { recursive: true, mode: 0o700 });
        }
        let result;
        if (command === 'validate') {
            const { report, metadata } = await loadDataset(config, { cache: store?.cache });
            result = { datasetId: id, source: metadata, quality: report };
        } else {
            let users;
            // One invocation uses one validated snapshot. Every later invocation fetches afresh.
            // The run command loads inside runReminder so invalid input also alerts the admin.
            let loaded;
            if (command === 'audit' || values.fixture) loaded = await loadDataset(config, { cache: store?.cache });
            if (values.fixture) users = [...new Set([...loaded.model.enrolments.values()].flatMap((s) => [...s]))].sort().map((rollNo, i) => ({ id: i + 1, rollNo, email: `fixture-${i + 1}@example.invalid` }));
            else if (values['users-fixture']) {
                users = JSON.parse(await readFile(values['users-fixture'], 'utf8'));
                if (!Array.isArray(users) || users.some((u) => !Number.isInteger(u.id))) throw new Error('Users fixture must be an array of { id, rollNo, email }');
            } else if (store) { if (command === 'audit') users = await store.users(); }
            else throw new Error('Database is not configured; use --fixture or --users-fixture for a dry run');
            const cohort = values.fixture ? 'ALL SHEET ROLLS (FIXTURE, NOT REGISTERED USERS)' : values['users-fixture'] ? 'USER FIXTURE' : 'REGISTERED DATABASE USERS';
            if (command === 'audit') {
                const { model, report, metadata } = loaded;
                const dates = values.date ? [targetDate(values.date, config.timezone)] : report.dates;
                const index = buildIndex(model);
                const rows = [];
                for (const date of dates) {
                    const planned = planRecipients(users, date, model, config, mode, index);
                    // Build every HTML/text email, too: an audit is a complete dry run, not
                    // just a count. Never pass the persistent delivery store or a live mode.
                    const dry = await runReminder({ config, date, users, mode: { ...mode, dryRun: true }, loader: async () => loaded });
                    if (dry.outcome === 'FAILED') throw new Error(dry.error);
                    rows.push({ date, wouldSend: dry.counts.wouldSend, missingRoomStudents: planned.recipients.filter((r) => r.exams.some((e) => e.missingRoom)).length, missingRoomExams: planned.recipients.reduce((n, r) => n + r.exams.filter((e) => e.missingRoom).length, 0), ambiguousRoomStudents: planned.recipients.filter((r) => r.exams.some((e) => e.ambiguousRoom)).length, clashStudents: planned.recipients.filter((r) => r.exams.some((e) => e.clash)).length, skipped: planned.summary });
                }
                const noExams = users.flatMap((user) => {
                    const roll = normaliseRoll(user.rollNo, config);
                    return validRoll(roll, config) && !index.examsByRoll.has(roll) ? [{ userId: user.id, roll }] : [];
                });
                result = { datasetId: id, cohort, source: metadata, dates: rows, registeredWithNoExams: noExams, quality: report };
                console.table(rows.map(({ skipped: _skipped, ...row }) => row));
            } else {
                result = await runReminder({ config, date: values.date, mode, store, users, ...(loaded ? { loader: async () => loaded } : {}), onPreview: output ? async (message) => {
                    // Normalised rolls are validated, and filenames never use sheet/user strings.
                    const { digest } = await import('../../services/exams/source.js');
                    const stem = digest(message.roll).slice(0, 16);
                    await writeFile(resolve(output, `${stem}.html`), message.html, { mode: 0o600 });
                    await writeFile(resolve(output, `${stem}.txt`), message.text, { mode: 0o600 });
                } : undefined });
                result.cohort = cohort;
                if (['FAILED', 'COMPLETE_WITH_FAILURES', 'MISSED_SEND_WINDOW'].includes(result.outcome) || result.counts.failed > 0) process.exitCode = 1;
            }
        }
        if (output) await writeFile(resolve(output, 'report.json'), JSON.stringify(result, null, 2), { mode: 0o600 });
        console.log(JSON.stringify(result, null, 2));
    }
} catch (err) {
    console.error(`[exams] ${err.message}`);
    process.exitCode = 1;
} finally {
    if (prisma) await prisma.$disconnect();
}
