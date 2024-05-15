import { z } from 'zod';
import { formatDateWithoutTime, getYesterday } from '../utils/date';
import { notion } from '../utils/notion';
import { isFullBlock, isFullPage } from '@notionhq/client';
import type { LookUpWithNestedKey } from '../types/util';

const tilPenaltyEnvSchema = z.object({
  TIL_STUDY_DATABASE_ID: z.string(),
  TIL_STUDY_PARTICIPANTS_BLOCK_ID: z.string(),
  TIL_STUDY_PENALTY_DATABASE_ID: z.string(),
  TIL_STUDY_PENALTY_AMOUNT: z.number(),
});

const tilPenaltyEnv = tilPenaltyEnvSchema.parse({
  TIL_STUDY_DATABASE_ID: process.env.TIL_STUDY_DATABASE_ID,
  TIL_STUDY_PARTICIPANTS_BLOCK_ID: process.env.TIL_STUDY_PARTICIPANTS_BLOCK_ID,
  TIL_STUDY_PENALTY_DATABASE_ID: process.env.TIL_STUDY_PENALTY_DATABASE_ID,
  TIL_STUDY_PENALTY_AMOUNT: Number(process.env.TIL_STUDY_PENALTY_AMOUNT),
});

process.env.TZ = 'Asia/Seoul';

const targetDate = getYesterday(new Date());

const listResponsePromise = notion.databases.query({
  database_id: tilPenaltyEnv.TIL_STUDY_DATABASE_ID,
  filter: {
    property: 'Date',
    date: {
      equals: formatDateWithoutTime(targetDate),
    },
  },
});

const studyParticipantsBlockResponsePromise = notion.blocks.retrieve({
  block_id: tilPenaltyEnv.TIL_STUDY_PARTICIPANTS_BLOCK_ID,
});

const [listResponse, studyParticipantsBlockResponse] = await Promise.all([
  listResponsePromise,
  studyParticipantsBlockResponsePromise,
]);

const participantSet = new Set();
listResponse.results.forEach((item) => {
  if (isFullPage(item)) {
    participantSet.add(item.created_by.id);
  }
});

if (
  !isFullBlock(studyParticipantsBlockResponse) ||
  studyParticipantsBlockResponse.type !== 'paragraph'
) {
  console.log(studyParticipantsBlockResponse);
  throw new Error('Invalid Study Participants Block Response.');
}

const studyParticipants = studyParticipantsBlockResponse.paragraph.rich_text
  .filter(
    (
      item,
    ): item is LookUpWithNestedKey<typeof item, 'mention', 'type', 'user'> =>
      item.type === 'mention' && item.mention.type === 'user',
  )
  .map((item) => item.mention.user.id);

const absentees = studyParticipants.filter(
  (participant) => !participantSet.has(participant),
);

if (absentees.length > 0) {
  await notion.pages.create({
    parent: { database_id: tilPenaltyEnv.TIL_STUDY_PENALTY_DATABASE_ID },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: `${formatDateWithoutTime(targetDate, '.')}`,
            },
          },
        ],
      },
      Date: {
        type: 'date',
        date: {
          start: formatDateWithoutTime(targetDate),
        },
      },
      People: {
        type: 'people',
        people: absentees.map((item) => ({ id: item })),
      },
      '개인별 금액': {
        type: 'number',
        number: tilPenaltyEnv.TIL_STUDY_PENALTY_AMOUNT,
      },
    },
  });
}
