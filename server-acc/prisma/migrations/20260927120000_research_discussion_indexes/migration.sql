CREATE INDEX "ResearchDiscussion_createdAt_id_idx"
ON "research_vault"."ResearchDiscussion"("createdAt", "id");

CREATE INDEX "ResearchDiscussion_isResolved_createdAt_id_idx"
ON "research_vault"."ResearchDiscussion"("isResolved", "createdAt", "id");

CREATE INDEX "ResearchDiscussionResearchArea_researchAreaId_discussionId_idx"
ON "research_vault"."ResearchDiscussionResearchArea"("researchAreaId", "discussionId");

CREATE INDEX "ResearchDiscussionReply_discussionId_parentId_createdAt_idx"
ON "research_vault"."ResearchDiscussionReply"("discussionId", "parentId", "createdAt");