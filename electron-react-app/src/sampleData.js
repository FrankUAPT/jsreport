import { createTask, generateUniqueId } from './data_models/Task';
import { userAlice, userBob, userCharlie, userDiana, userEdward, userFiona } from './sampleUsers';

// --- Conference Planning Project ---

// IDs for easier dependency linking
const confPlanningEpicId = generateUniqueId();

// Level 2 IDs
const venueSelectionId = generateUniqueId();
const speakerMgmtId = generateUniqueId();
const marketingRegId = generateUniqueId();
const contentCreationId = generateUniqueId();
const logisticsId = generateUniqueId();
const postConfId = generateUniqueId();

// Level 3 & 4 IDs under Venue Selection
const researchVenuesId = generateUniqueId();
const contactVenuesId = generateUniqueId();
const negotiateContractVenueId = generateUniqueId();
const finalizeVenueId = generateUniqueId(); // Milestone

// Level 3 & 4 IDs under Speaker Management
const identifyKeynotesId = generateUniqueId();
const inviteSpeakersId = generateUniqueId();
const confirmSpeakersId = generateUniqueId(); // Milestone
const collectSpeakerBiosId = generateUniqueId();

// Level 3 & 4 IDs under Marketing & Registration
const developMarketingPlanId = generateUniqueId();
const launchWebsiteId = generateUniqueId();
const registrationOpensId = generateUniqueId(); // Milestone
const manageRegistrationsId = generateUniqueId();

// Level 3 & 4 IDs under Content Creation
const defineAgendaId = generateUniqueId();
const preparePresentationsId = generateUniqueId();
const designHandoutsId = generateUniqueId();

// Level 3 & 4 IDs under Logistics
const arrangeCateringId = generateUniqueId();
const planAVSetupId = generateUniqueId();
const coordinateVolunteersId = generateUniqueId();
const conferenceDay1Id = generateUniqueId(); // Milestone

// Level 3 & 4 IDs under Post-Conference
const sendThankYousId = generateUniqueId();
const analyzeFeedbackId = generateUniqueId();
const finalReportId = generateUniqueId();


export const conferenceTasks = [
  // --- EPIC ---
  createTask({
    name: "Conference Planning",
    startDate: new Date(2024, 5, 1), // June 1, 2024
    endDate: new Date(2024, 11, 15), // Dec 15, 2024
    status: "In Progress",
    progress: 15,
    assigneeId: userAlice.id,
    dependencies: [], // Epic has no dependencies
  }, confPlanningEpicId, [venueSelectionId, speakerMgmtId, marketingRegId, contentCreationId, logisticsId, postConfId]),

  // --- LEVEL 2: Venue Selection ---
  createTask({
    name: "Venue Selection",
    parentId: confPlanningEpicId,
    startDate: new Date(2024, 5, 1),
    endDate: new Date(2024, 6, 15),
    status: "In Progress",
    progress: 40,
    assigneeId: userBob.id,
    dependencies: [],
  }, venueSelectionId, [researchVenuesId, contactVenuesId, negotiateContractVenueId, finalizeVenueId]),

  createTask({ name: "Research Venues", parentId: venueSelectionId, startDate: new Date(2024, 5, 1), endDate: new Date(2024, 5, 15), status: "Done", progress: 100, assigneeId: userBob.id, dependencies: [] }, researchVenuesId),
  createTask({ name: "Contact Venues for Quotes", parentId: venueSelectionId, startDate: new Date(2024, 5, 16), endDate: new Date(2024, 5, 30), status: "In Progress", progress: 50, assigneeId: userBob.id, dependencies: [{ predecessorId: researchVenuesId, type: 'FS', lag: 0 }] }, contactVenuesId),
  createTask({ name: "Negotiate Contract", parentId: venueSelectionId, startDate: new Date(2024, 6, 1), endDate: new Date(2024, 6, 10), status: "To Do", progress: 0, assigneeId: userAlice.id, dependencies: [{ predecessorId: contactVenuesId, type: 'FS', lag: 0 }] }, negotiateContractVenueId),
  createTask({ name: "Venue Confirmed", parentId: venueSelectionId, startDate: new Date(2024, 6, 11), endDate: new Date(2024, 6, 11), status: "To Do", progress: 0, isMilestone: true, assigneeId: userAlice.id, dependencies: [{ predecessorId: negotiateContractVenueId, type: 'FS', lag: 0 }] }, finalizeVenueId),

  // --- LEVEL 2: Speaker Management ---
  createTask({
    name: "Speaker Management",
    parentId: confPlanningEpicId,
    startDate: new Date(2024, 5, 15),
    endDate: new Date(2024, 7, 30),
    status: "To Do",
    progress: 10,
    assigneeId: userCharlie.id,
    dependencies: [], // This phase can start somewhat independently of full venue confirmation, but sub-tasks will have dependencies
  }, speakerMgmtId, [identifyKeynotesId, inviteSpeakersId, confirmSpeakersId, collectSpeakerBiosId]),

  createTask({ name: "Identify Keynote Speakers", parentId: speakerMgmtId, startDate: new Date(2024, 5, 15), endDate: new Date(2024, 6, 1), status: "In Progress", progress: 75, assigneeId: userCharlie.id, dependencies: [] }, identifyKeynotesId),
  createTask({ name: "Invite Speakers", parentId: speakerMgmtId, startDate: new Date(2024, 6, 2), endDate: new Date(2024, 6, 15), status: "To Do", progress: 0, assigneeId: userCharlie.id, dependencies: [{ predecessorId: identifyKeynotesId, type: 'FS', lag: 0 }] }, inviteSpeakersId),
  createTask({ name: "Keynote Speaker Booked", parentId: speakerMgmtId, startDate: new Date(2024, 6, 16), endDate: new Date(2024, 6, 16), status: "To Do", progress: 0, isMilestone: true, assigneeId: userCharlie.id, dependencies: [{ predecessorId: inviteSpeakersId, type: 'FS', lag: 0 }] }, confirmSpeakersId),
  createTask({ name: "Collect Speaker Bios & Photos", parentId: speakerMgmtId, startDate: new Date(2024, 6, 17), endDate: new Date(2024, 7, 15), status: "To Do", progress: 0, assigneeId: userDiana.id, dependencies: [{ predecessorId: confirmSpeakersId, type: 'FS', lag: 0 }] }, collectSpeakerBiosId),

  // --- LEVEL 2: Marketing & Registration ---
  createTask({
    name: "Marketing & Registration",
    parentId: confPlanningEpicId,
    startDate: new Date(2024, 6, 1),
    endDate: new Date(2024, 9, 30),
    status: "To Do",
    progress: 0,
    assigneeId: userDiana.id,
    dependencies: [{ predecessorId: finalizeVenueId, type: 'FS', lag: 7 }], // Marketing can gear up once venue is confirmed (with a 7-day lag for planning)
  }, marketingRegId, [developMarketingPlanId, launchWebsiteId, registrationOpensId, manageRegistrationsId]),

  createTask({ name: "Develop Marketing Plan", parentId: marketingRegId, startDate: new Date(2024, 6, 18), endDate: new Date(2024, 7, 7), status: "To Do", progress: 0, assigneeId: userDiana.id, dependencies: [] }), // Internal start based on parent's start
  createTask({ name: "Launch Conference Website", parentId: marketingRegId, startDate: new Date(2024, 7, 8), endDate: new Date(2024, 7, 21), status: "To Do", progress: 0, assigneeId: userEdward.id, dependencies: [{ predecessorId: developMarketingPlanId, type: 'FS', lag: 0 }] }, launchWebsiteId),
  createTask({ name: "Registration Opens", parentId: marketingRegId, startDate: new Date(2024, 7, 22), endDate: new Date(2024, 7, 22), status: "To Do", progress: 0, isMilestone: true, assigneeId: userDiana.id, dependencies: [{ predecessorId: launchWebsiteId, type: 'FS', lag: 0 }] }, registrationOpensId),
  createTask({ name: "Manage Registrations & Enquiries", parentId: marketingRegId, startDate: new Date(2024, 7, 23), endDate: new Date(2024, 9, 30), status: "To Do", progress: 0, assigneeId: userFiona.id, dependencies: [{ predecessorId: registrationOpensId, type: 'SS', lag: 0 }] }, manageRegistrationsId), // SS: Starts when registration opens

  // --- LEVEL 2: Content Creation ---
  createTask({
    name: "Content Creation",
    parentId: confPlanningEpicId,
    startDate: new Date(2024, 7, 1),
    endDate: new Date(2024, 9, 15),
    status: "To Do",
    assigneeId: userEdward.id,
    dependencies: [],
  }, contentCreationId, [defineAgendaId, preparePresentationsId, designHandoutsId]),
  createTask({ name: "Define Conference Agenda", parentId: contentCreationId, startDate: new Date(2024, 7, 1), endDate: new Date(2024, 7, 15), status: "To Do", assigneeId: userAlice.id, dependencies: [{ predecessorId: confirmSpeakersId, type: 'FS', lag: 0 }] }, defineAgendaId),
  createTask({ name: "Prepare Presentation Materials", parentId: contentCreationId, startDate: new Date(2024, 7, 16), endDate: new Date(2024, 8, 30), status: "To Do", assigneeId: userEdward.id, dependencies: [{ predecessorId: defineAgendaId, type: 'FS', lag: 0 }] }, preparePresentationsId),
  createTask({ name: "Design Handouts & Digital Materials", parentId: contentCreationId, startDate: new Date(2024, 8, 1), endDate: new Date(2024, 9, 10), status: "To Do", assigneeId: userEdward.id, dependencies: [{ predecessorId: preparePresentationsId, type: 'FF', lag: -5 }] }, designHandoutsId), // FF: Handouts finish 5 days before presentations are finalized

  // --- LEVEL 2: Logistics & On-site ---
  createTask({
    name: "Logistics & On-site",
    parentId: confPlanningEpicId,
    startDate: new Date(2024, 8, 1),
    endDate: new Date(2024, 10, 15),
    status: "To Do",
    assigneeId: userFiona.id,
    dependencies: [],
  }, logisticsId, [arrangeCateringId, planAVSetupId, coordinateVolunteersId, conferenceDay1Id]),
  createTask({ name: "Arrange Catering", parentId: logisticsId, startDate: new Date(2024, 8, 1), endDate: new Date(2024, 8, 20), status: "To Do", assigneeId: userFiona.id, dependencies: [{ predecessorId: finalizeVenueId, type: 'FS', lag: 14 }, { predecessorId: registrationOpensId, type: 'FS', lag: 14 }] }, arrangeCateringId), // Depends on venue and reg opening
  createTask({ name: "Plan A/V Setup", parentId: logisticsId, startDate: new Date(2024, 8, 15), endDate: new Date(2024, 9, 10), status: "To Do", assigneeId: userBob.id, dependencies: [{ predecessorId: finalizeVenueId, type: 'FS', lag: 0 }, { predecessorId: defineAgendaId, type: 'FS', lag: 0 }] }, planAVSetupId),
  createTask({ name: "Coordinate Volunteers", parentId: logisticsId, startDate: new Date(2024, 9, 1), endDate: new Date(2024, 9, 30), status: "To Do", assigneeId: userCharlie.id, dependencies: [] }),
  createTask({ name: "Conference Day 1", parentId: logisticsId, startDate: new Date(2024, 10, 14), endDate: new Date(2024, 10, 14), status: "To Do", isMilestone: true, assigneeId: userAlice.id, dependencies: [{ predecessorId: arrangeCateringId, type: 'FS', lag: 0 }, { predecessorId: planAVSetupId, type: 'FS', lag: 0 }, { predecessorId: coordinateVolunteersId, type: 'FS', lag: 0 }, {predecessorId: designHandoutsId, type: 'FS', lag: 0}] }, conferenceDay1Id),

  // --- LEVEL 2: Post-Conference ---
  createTask({
    name: "Post-Conference Activities",
    parentId: confPlanningEpicId,
    startDate: new Date(2024, 10, 16),
    endDate: new Date(2024, 11, 15),
    status: "To Do",
    assigneeId: userAlice.id,
    dependencies: [{ predecessorId: conferenceDay1Id, type: 'FS', lag: 1 }], // Starts day after conference
  }, postConfId, [sendThankYousId, analyzeFeedbackId, finalReportId]),
  createTask({ name: "Send Thank You Notes", parentId: postConfId, startDate: new Date(2024, 10, 17), endDate: new Date(2024, 10, 23), status: "To Do", assigneeId: userDiana.id, dependencies: [] }),
  createTask({ name: "Analyze Feedback Surveys", parentId: postConfId, startDate: new Date(2024, 10, 17), endDate: new Date(2024, 10, 30), status: "To Do", assigneeId: userEdward.id, dependencies: [] }), // Can run parallel to thank yous
  createTask({ name: "Prepare Final Report", parentId: postConfId, startDate: new Date(2024, 11, 1), endDate: new Date(2024, 11, 10), status: "To Do", assigneeId: userAlice.id, dependencies: [{ predecessorId: analyzeFeedbackId, type: 'FS', lag: 0 }] }, finalReportId),
];

export const sampleTasks = conferenceTasks;
export { sampleUsers, usersById } from './sampleUsers';
