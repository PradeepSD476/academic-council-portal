import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { STANDARDIZED_BRANCHES, SMP_BRANCH_MAP } from '../../utils/rollValidator.js';

const questionnaireSchema = z.object({
    branch: z.string().refine(
        (val) => STANDARDIZED_BRANCHES.includes(val) || !!SMP_BRANCH_MAP[val?.toUpperCase()],
        { message: 'Invalid academic branch selected.' }
    ).transform(
        (val) => STANDARDIZED_BRANCHES.includes(val) ? val : (SMP_BRANCH_MAP[val?.toUpperCase()] || val)
    ),
    techInterests: z.array(z.string()),
    sportsInterests: z.array(z.string()),
    cultInterests: z.array(z.string()),
    languages: z.array(z.string()),
    hobbies: z.array(z.string()),
    goals: z.array(z.string()),
    preference: z.enum(['CORE', 'NON_CORE', 'NO_PREFERENCE'])
});

export const getSystemConfig = async (req, res) => {
    try {
        const config = await prisma.systemConfig.findFirst();
        if (!config) {
            return res.status(404).json({ message: 'System configuration not found' });
        }
        res.json({
            academicYear: config.currentAcademicYear,
            isRegistrationOpen: config.isRegistrationOpen,
            isAllocationComplete: config.isAllocationComplete
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching config' });
    }
};

export const submitQuestionnaire = async (req, res) => {
    try {
        const config = await prisma.systemConfig.findFirst();
        if (!config || !config.isRegistrationOpen) {
            return res.status(403).json({ message: 'Registration is currently closed.' });
        }

        if (req.user.response) {
            return res.status(400).json({ message: 'You have already submitted the questionnaire.' });
        }

        const parsedData = questionnaireSchema.parse(req.body);

        const response = await prisma.questionnaireResponse.create({
            data: {
                userId: req.user.id,
                academicYear: config.currentAcademicYear,
                ...parsedData
            }
        });

        res.status(201).json({ message: 'Questionnaire submitted successfully!', response });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: 'Invalid data', errors: error.errors });
        } else {
            res.status(500).json({ message: 'Server error during submission' });
        }
    }
};