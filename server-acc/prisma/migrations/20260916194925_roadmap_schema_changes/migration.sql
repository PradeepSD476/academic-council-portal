-- CreateTable
CREATE TABLE "Roadmap" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT,
    "icon" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapSection" (
    "id" SERIAL NOT NULL,
    "roadmapId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoadmapSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapChapter" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,

    CONSTRAINT "RoadmapChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_slug_key" ON "Roadmap"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapChapter_sectionId_slug_key" ON "RoadmapChapter"("sectionId", "slug");

-- AddForeignKey
ALTER TABLE "RoadmapSection" ADD CONSTRAINT "RoadmapSection_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapChapter" ADD CONSTRAINT "RoadmapChapter_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RoadmapSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
