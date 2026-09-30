window.executionLog={
  "updated": "2026-09-30T17:51:04-03:00",
  "defaults": [
    "Local-only work; no pushes, deployment, production data or infrastructure access.",
    "Six-photo experiment only. No dense capture arm approved or implied.",
    "Fresh fictional SQLite database, local storage and disabled external image generation.",
    "Local reminder queue is the reversible default; external messages require explicit authorization.",
    "Professional acceptance and final route choice remain pending.",
    "User deferred and erased the local backup/restore flow. Do not rebuild it during this delivery without later instruction."
  ],
  "tasks": [
    {
      "id": "00",
      "title": "Recovered checkout and local baseline",
      "depends": [],
      "requirement": "Read all decisions and source; preserve prior work; establish real local behavior and portable execution log.",
      "criteria": [
        "Real Git history restored from the supplied repository; local branch and original snapshot retained.",
        "Fresh local SQLite and local media storage; no external processing or production access.",
        "Login, client, upload, milestone placement and reload exercised; failure behavior checked.",
        "Go checks and web build pass; dated browser evidence and log navigation verified; milestone committed."
      ],
      "status": "verified",
      "changes": [
        "Read map.md, demo-plan.md and all 21 issue files; later broad MVP decision applied.",
        "Restored real repository history from https://github.com/looizao/trama at 45a6d8accd5bbcf2f54b28631aaba4cbc7df80ae.",
        "Created local/visagist-mvp. On user instruction replaced obsolete local app files; prior source and private data archived under ignored .scratch/private.",
        "Created scripts/dev-local.sh for isolated loopback SQLite/local-media operation with external generation disabled."
      ],
      "limitations": [
        "Baseline confirms only existing client/image/milestone behavior. No 3D or new product workflows have been implemented."
      ],
      "verification": [
        {
          "command": "git status --short --branch",
          "result": "Clean repository after source recovery; branch local/visagist-mvp."
        },
        {
          "command": "Source inspection",
          "result": "Latest existing commit uses SQLite. Earlier snapshot used PostgreSQL. No consultations, labeled views, permission/deletion endpoints, 3D catalog/viewer or comparative demos exist."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS: cmd/api and internal/app; worker and migration compile."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS: TypeScript and Vite 7.3.6; 169 modules, JS 361.52 kB (114.29 kB gzip)."
        },
        {
          "command": "Local API and browser flow",
          "result": "Health 200; anonymous clients 401; login 200; invalid client 400; client and milestone 201; diagnostic PNG upload 201; content bytes unchanged; placement 200; reload preserves content; unconfigured generation 503; nonexistent DELETE endpoint 404."
        }
      ],
      "pictures": [
        {
          "src": "assets/baseline-login.png",
          "caption": "Fresh local login. Isolated credentials; no production data.",
          "date": "2026-09-29T21:49:12-03:00"
        },
        {
          "src": "assets/baseline-progression.png",
          "caption": "Persisted fictional client and baseline milestone after browser reload. Green image is a diagnostic transfer fixture, not a portrait or reconstruction input.",
          "date": "2026-09-29T21:49:12-03:00"
        }
      ],
      "commits": [
        "3f84aee"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T21:46:30-03:00",
          "text": "Execution initiated. One task active. All eight alternatives retained; no winning route chosen."
        },
        {
          "date": "2026-09-29T21:49:12-03:00",
          "text": "Baseline and execution log verified; preparing coherent local milestone commit."
        },
        {
          "date": "2026-09-29T21:49:39-03:00",
          "text": "User requested local demo credentials in AGENTS.md and mandated the same account for local use. Added existing credentials locally; AGENTS.md excluded from milestone staging to keep credentials out of Git."
        }
      ]
    },
    {
      "id": "01",
      "title": "Affirmative permission, withdrawal and media lifecycle",
      "depends": [
        "00"
      ],
      "requirement": "Apply approved private studio permission and deletion policy before handling client material.",
      "criteria": [
        "Client acknowledgement includes notice version, date and method; professional checkbox alone is insufficient.",
        "Upload and processing require active permission; another studio cannot access records or media.",
        "Individual deletion removes transitive dependent media; withdrawal and client deletion cancel jobs and purge temporary material.",
        "Tombstones and completion-time guards prevent delayed work recreating removed material; audit retains no deleted media.",
        "UI confirmation explains affected data and request status; reload and failure paths verified."
      ],
      "status": "verified",
      "changes": [],
      "limitations": [
        "Locally verified for existing image assets and generation runs. Future 3D outputs must register provenance and use the same mutation guards; later tasks remain pending.",
        "Acknowledgement records a client-entered affirmation; identity verification is not claimed. No real client inputs used.",
        "Cloud object deletion and Temporal cancellation code added, but no production storage or production worker was accessed. Production rollout remains unverified.",
        "Backup creation, expiry and restore are deferred by superseding user instruction. Client deletion and interrupted cleanup safeguards remain active."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS, including acknowledgement/version/name rejection, cross-studio access/deletion denial, transitive media erasure, renewed permission across restart, separate-worker late-result cancellation, missing/corrupt ledger fail-closed behavior and cleanup retry on restart."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS; separate App/worker race fixture prevents late image recreation and cancellation overwrite."
        },
        {
          "command": "python scripts/verify-local-privacy.py",
          "result": "PASS: full running local flow through anonymous denial, client link, wrong-name rejection, active upload/read, unconfirmed deletion failure, withdrawal, missing media after reload, re-acknowledgement, new upload, client deletion and retained completion history."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS: 170 modules; final JS 375.60 kB (118.28 kB gzip)."
        },
        {
          "command": "@Browser acknowledgement and withdrawal checks",
          "result": "Client entry succeeded and persisted after reload. Impact displays 1 diagnostic image and 0 jobs. CLI removal returned completed; reload shows withdrawn, zero images, blocked uploads and completed request history. Portuguese view inspected."
        }
      ],
      "pictures": [
        {
          "src": "assets/permission-required.png",
          "caption": "Existing local diagnostic media requires fresh client acknowledgement before access or further uploads.",
          "date": "2026-09-29T22:01:48-03:00"
        },
        {
          "src": "assets/client-acknowledgement.png",
          "caption": "Client-facing workflow records a fictional test acknowledgement without a client account; no studio proxy checkbox.",
          "date": "2026-09-29T22:01:48-03:00"
        },
        {
          "src": "assets/permission-active.png",
          "caption": "Studio sees acknowledgement name, method, date and notice version after reload.",
          "date": "2026-09-29T22:01:48-03:00"
        },
        {
          "src": "assets/withdrawal-impact.png",
          "caption": "Review names the affected media, cancellation, dependent removal and retained request status before confirmation.",
          "date": "2026-09-29T22:07:50-03:00"
        },
        {
          "src": "assets/withdrawal-complete.png",
          "caption": "After removal and reload: withdrawn permission, zero images, disabled upload and completed privacy request.",
          "date": "2026-09-29T22:07:50-03:00"
        },
        {
          "src": "assets/privacy-portuguese.png",
          "caption": "Localized privacy and withdrawal status in Portuguese.",
          "date": "2026-09-29T22:07:50-03:00"
        },
        {
          "src": "assets/privacy-guards.svg",
          "caption": "Diagnostic overview alongside actual API, persistence, race and failure verification results.",
          "date": "2026-09-29T22:07:50-03:00"
        }
      ],
      "commits": [
        "d428514"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T21:49:39-03:00",
          "text": "Starting affirmative permission and cascading media lifecycle with server-side guards."
        },
        {
          "date": "2026-09-29T22:01:48-03:00",
          "text": "Implemented one-time, 15-minute client acknowledgement pages and private studio controls. Added transitive deletion, durable ledger, recovery on startup, shared API/worker file locks, cancelled-run preservation and late-result rejection."
        },
        {
          "date": "2026-09-29T22:07:50-03:00",
          "text": "Browser assertion initially searched capitalized Withdrawn; CSS capitalizes the visible label while DOM text is lowercase. Corrected the assertion using observed state; application withdrawal behavior was correct."
        },
        {
          "date": "2026-09-29T22:07:50-03:00",
          "text": "Task verified locally. Remaining product and all comparative demos remain pending. Preparing local commit before moving to backup safeguards."
        }
      ]
    },
    {
      "id": "02",
      "title": "Local backup flow (deferred by user)",
      "depends": [
        "01"
      ],
      "requirement": "Test encrypted local backups, maximum 30-day expiry and deletion-aware restoration.",
      "criteria": [
        "Snapshot, encryption, download-equivalent copy, decryption and SQLite integrity verified locally.",
        "Expired archives rejected and removed; restore replays a protected deletion ledger before serving.",
        "Stale backup cannot restore deleted originals or derivatives; no production backup changes."
      ],
      "status": "blocked",
      "changes": [
        "Built an initial local encrypted snapshot experiment, verified copy/decrypt and SQLite integrity, then erased the entire new backup/restore implementation at the user's request.",
        "Removed scripts/local-backup.py, cmd/local-privacy-replay, the generated encrypted test archive and its local passphrase.",
        "Removed the existing backup deployment script and systemd service/timer from the local checkout. Removed unimplemented backup promises from client consent and deletion explanations in English and Portuguese. Updated local AGENTS instructions to defer backups."
      ],
      "limitations": [
        "User explicitly deferred rebuilding the backup flow. No backup expiry/restore implementation is being delivered or claimed complete.",
        "Backup deployment source was removed locally. Production infrastructure, running services and stored backups were neither accessed nor changed."
      ],
      "verification": [
        {
          "command": "Initial local snapshot experiment (subsequently erased)",
          "result": "Created one 7,517-byte encrypted synthetic local archive and verified retained copy, decryption and SQLite integrity. Deleted this archive and its key after the user cancelled the flow. No deletion-aware restored database test had been performed."
        },
        {
          "command": "Removal inspection",
          "result": "New local backup script, replay command, archive directory and key no longer exist. The committed client deletion ledger and media guards remain intact."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS all Go packages after backup removal."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS TypeScript and Vite build, 170 modules."
        },
        {
          "command": "python scripts/verify-local-privacy.py",
          "result": "PASS full local permission, upload, withdrawal, deletion, reload and failure checks using the mandated demo account. No backup operation performed."
        },
        {
          "command": "In-app Browser: open withdrawal impact, inspect then cancel",
          "result": "PASS privacy explanation contains no backup promises. Diagnostic screenshot retained; no deletion action submitted."
        }
      ],
      "pictures": [
        {
          "src": "assets/backup-flow-removed.png",
          "caption": "Local withdrawal impact after removing backup promises. No photos or media in this fictional client.",
          "date": "2026-09-29T22:15:56-03:00"
        }
      ],
      "commits": [
        "4d862fc6ad79021a3e031a3ddce0a6801458bd5f"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T22:07:59-03:00",
          "text": "Privacy milestone committed as d428514. Starting local 30-day expiry and deletion-aware restore safeguards."
        },
        {
          "date": "2026-09-29T22:11:22-03:00",
          "text": "Superseding user instruction: erase all of this backup flow; rebuild later. Removed new work and deferred task. No backup milestone commit made."
        },
        {
          "date": "2026-09-29T22:14:48-03:00",
          "text": "Expanded the removal to all backup workflow source in this checkout. No production commands, services or stored backups changed."
        },
        {
          "date": "2026-09-29T22:15:56-03:00",
          "text": "Backup removal verified. Rebuilding remains deferred, not complete."
        }
      ]
    },
    {
      "id": "03",
      "title": "Consultations and reusable intake",
      "depends": [
        "00"
      ],
      "requirement": "Persist goals, maintenance tolerance, optional observations and reusable intake templates.",
      "criteria": [
        "Required fields validated by API and UI; incomplete records have clear errors.",
        "Templates are studio-private, reusable and editable without altering earlier consultations.",
        "Consultation versions and client preferences survive reload; studio boundaries tested."
      ],
      "status": "verified",
      "changes": [
        "Added studio-private reusable question templates with versioned edits, archival/reactivation, and optional required custom answers. Each consultation stores an immutable template snapshot.",
        "Added required client goal and low/moderate/high maintenance tolerance, optional preferences/routine, structured hair/beard observations and recommendation rationale. New visits and revisions persist independently.",
        "Progress log now follows task hashes on navigation/back/forward as well as selector changes."
      ],
      "limitations": [
        "Template questions and client preferences are user-entered text. No personality inference or automatic professional recommendation is performed. Professional review of the demo consultation remains pending.",
        "Maintenance tolerance uses reversible low/moderate/high choices plus free text. Up to 12 template questions; existing consultation snapshots remain editable only by appending revisions."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS required fields, stale revision/template conflicts, snapshot preservation, archive restrictions, anonymous/foreign-studio isolation, persistence after reopening and consultation cascade on client deletion."
        },
        {
          "command": "python scripts/verify-local-consultations.py",
          "result": "PASS live required-field/custom-answer rejection, reusable template edit, immutable original questions, stale conflicts, persistence on reload and deletion of consultations with client."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS 1.887s, including consultation and privacy tests."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS TypeScript and Vite, 171 modules, 388.20 kB JS / 123.23 kB gzip."
        },
        {
          "command": "In-app Browser: create template, incomplete intake, complete intake, edit template, revise, reload and inspect history",
          "result": "PASS original and new goal retained; template now v2 while both consultation snapshots remain v1. English and Portuguese labels rendered."
        },
        {
          "command": "Progress log: task selector, HTTP asset links and source-file existence checks",
          "result": "PASS task 03 renders criteria, actual checks and three dated screenshots. Every retained evidence picture exists and returns HTTP 200 via relative links."
        }
      ],
      "pictures": [
        {
          "src": "assets/consultation-intake-form.png",
          "caption": "Intermediate intake with required goal/maintenance, optional hair observation/rationale and required custom template answer. All inputs fictional.",
          "date": "2026-09-29T22:25:58-03:00"
        },
        {
          "src": "assets/consultation-history.png",
          "caption": "Reloaded history shows both revisions, original questions v1, and the edited reusable template v2. Fictional client only.",
          "date": "2026-09-29T22:25:58-03:00"
        },
        {
          "src": "assets/consultation-portuguese.png",
          "caption": "Portuguese labels and dates for the same preserved consultation history.",
          "date": "2026-09-29T22:25:58-03:00"
        }
      ],
      "commits": [
        "e3d10ce46329e83a0e9ee0faf4defe3002fd7998"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T22:11:22-03:00",
          "text": "Backup flow erased and deferred by explicit user instruction. Advancing to the next independent task: consultations and reusable intake."
        },
        {
          "date": "2026-09-29T22:15:56-03:00",
          "text": "Beginning consultation and reusable intake implementation after verified backup removal."
        },
        {
          "date": "2026-09-29T22:22:27-03:00",
          "text": "API and frontend compile. Preparing local browser workflow and persistence checks; task not yet verified."
        },
        {
          "date": "2026-09-29T22:25:58-03:00",
          "text": "Browser automation label matching timed out twice. Inspected fresh DOM and used role/name locators to complete the same flow; no product error or unperformed save claimed."
        },
        {
          "date": "2026-09-29T22:26:41-03:00",
          "text": "Consultation milestone verified locally. Template and original/revised fictional intake remain available in the local app for professional review."
        }
      ]
    },
    {
      "id": "04",
      "title": "Guided labeled uploads",
      "depends": [
        "01",
        "03"
      ],
      "requirement": "Six view slots with optional crown/under-chin and honest incomplete input handling.",
      "criteria": [
        "Front, both three-quarter views, both profiles and back have capture guidance and labels.",
        "Review, replacement, optional details and missing-view summary work across reloads.",
        "Invalid uploads fail clearly; no silent claim that six views guarantee reconstruction."
      ],
      "status": "verified",
      "changes": [
        "Photo sets persist six main views and two optional details, missing-view counts, consultation links, reviewed replacements and reassignment of existing photos. Replaced images remain in gallery; explicit deletion uses the privacy workflow.",
        "Rejects corrupt or unsupported images before storage; defaults are 10 MB, 32 megapixels and 12000 pixels per side. Added the Go Authors’ WebP decoder v0.46.0 with verified BSD-3-Clause notice/provenance.",
        "Client gallery, progression and capture previews now hide media and disable processing when permission lookup fails. Python bytecode is excluded from Git."
      ],
      "limitations": [
        "Pictures in this milestone are colored diagnostic squares, never portraits or reconstruction accuracy evidence. Full fictional photo libraries and 3D assets belong to task 05.",
        "Capture quality and angle correctness are reviewed by the professional. The app validates file decoding and size, but does not infer sharpness or promise reconstruction from six views.",
        "Earlier images remain in the private gallery when replacing or clearing a slot. Explicit removal purges dependent views/media; withdrawal purges all server-owned media. Original files selected from the user’s filesystem remain outside app control."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS all packages, including required/optional labels, incomplete and complete sets, replacement/history, stale conflicts, corrupt-file rejection, studio isolation, restart, withdrawal and client cascade deletion."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS 2.251s, privacy/consultation/photo workflows."
        },
        {
          "command": "mise exec go@1.26.0 -- go test golang.org/x/image/webp",
          "result": "PASS 0.072s: pinned decoder’s format regression tests. License text verified from downloaded tagged module; package version verified via official Go module proxy."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS 172 modules, 403.46 kB JS / 127.42 kB gzip after final UI fixes."
        },
        {
          "command": "python scripts/verify-local-photos.py",
          "result": "PASS live eight-slot labels, missing-view counts, replacement retaining originals, corrupt/unsupported file failures, stale/duplicate conflicts, clear/reassign, reload, dependent deletion, withdrawal and no recreation."
        },
        {
          "command": "python scripts/verify-local-privacy.py; python scripts/verify-local-consultations.py",
          "result": "PASS regression workflows with valid generated PNG fixture and mandated demo account; disposable records deleted."
        },
        {
          "command": "In-app Browser: linked set, preview, upload, reload, invalid file, replacement, clear and reassign",
          "result": "PASS 0/6 incomplete state, 1/6 saved state after reload, visible unsupported file error, original and replacement retained. Existing-photo numbers now consistent with source gallery."
        },
        {
          "command": "In-app Browser plus CLI: withdraw while unsaved preview is open",
          "result": "PASS two stored diagnostic images erased. Before reload: preview images 0, slot images 0, all eight upload inputs disabled, missing state 0/6. Reload preserved withdrawn/empty state."
        },
        {
          "command": "Final npm --prefix web run build after permission-error guard",
          "result": "PASS TypeScript/Vite with permission gating and grouped notice condition; permission-error guard inspected in source. Browser withdrawal branch verified separately."
        },
        {
          "command": "Portable log image validation",
          "result": "PASS every retained image exists and loads via its relative asset URL."
        }
      ],
      "pictures": [
        {
          "src": "assets/guided-upload-empty.png",
          "caption": "Empty six-view set with external capture guide and optional detail slots. Upload blocked until fictional client acknowledgement.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-review.png",
          "caption": "Intermediate review before upload. The green square is a diagnostic fixture, not a client portrait.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-invalid.png",
          "caption": "Unsupported text-file rejection while the saved front view remains intact. Diagnostic image only.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-retained.png",
          "caption": "Retained original selected again after replacement and clear/reassign. Both diagnostic square images remain in private gallery.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-withdrawn.png",
          "caption": "Final withdrawal state: no stored images or open preview, all six main views missing and uploads disabled. Consultation history remains.",
          "date": "2026-09-29T22:46:16-03:00"
        }
      ],
      "commits": [
        "c5dd386930eb31a87dc38ec4c426bc1ee8a8a3bc"
      ],
      "outputs": [
        {
          "href": "assets/image-decoder-provenance.json",
          "label": "WebP decoder source, pinned version, license notice and attribution requirements"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T22:27:02-03:00",
          "text": "Beginning guided photo-set uploads. Incomplete six-view sets remain usable and explicitly labeled; no dense-capture experiment is implied."
        },
        {
          "date": "2026-09-29T22:37:47-03:00",
          "text": "Full PNG/JPEG/WebP decoding now rejects corrupted files. The older privacy CLI fixture failed HTTP 400 due to malformed PNG bytes, revealing a fixture problem previously hidden by header-only checks. Replaced it with a valid generated colored diagnostic square, cleaned the disposable failed record and reran the full privacy workflow successfully."
        },
        {
          "date": "2026-09-29T22:46:16-03:00",
          "text": "Browser workflow fixes verified: consistent existing-photo numbering, focused review panel, revoked object URLs on withdrawal, and progression images hidden without active permission."
        },
        {
          "date": "2026-09-29T22:46:16-03:00",
          "text": "Task 04 technical acceptance verified locally. Professional capture review and actual reconstruction remain pending."
        }
      ]
    },
    {
      "id": "05",
      "title": "Shared representative assets and fictional clients",
      "depends": [
        "01",
        "04"
      ],
      "requirement": "Create commercially usable reusable 3D styles and coherent synthetic six-view demo clients.",
      "criteria": [
        "Distinct real hair/beard meshes, materials and consistent mannequin renders exist with structured provenance.",
        "Synthetic identity consistent across views; synthetic inputs and simulated visits labeled.",
        "Interchange, independent selection, keep-current and clean-shaven tested; private outputs excluded from Git."
      ],
      "status": "verified",
      "changes": [
        "Acquired exact FLAME 2023 Open archive through user-authenticated in-app browser after explicit agreement acceptance. Extracted in private ignored model storage with file permissions 0600; retained SHA-256 and commercial license provenance.",
        "Pinned MPFB source loaded offline inside private BLENDER_USER_RESOURCES. Created reproducible acquisition/render scripts; first neutral mannequin render underway.",
        "Core CC0 MakeHuman pack acquired and CRC verified (280,737,770 bytes). Pinned archive SHA-256 b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107; per-asset license and author metadata retained. Added real eyes and replaced uneven torso trim with planar cut and cap.",
        "Generated rounded natural coils as solid reusable helical strands and five independent beard meshes sampled from the visible face. Corrected half-quad sampling and applied smooth point-level beard boundaries. Eleven hair and five beard GLBs retained privately; metadata and renders available for review.",
        "Populated three synthetic identities through local authenticated API: required goals and maintenance, reusable intake, nine complete photo sets and 72 retained labeled renders. Expected and follow-up labels explicitly state simulation. Importer stores private progress and refuses automatic restoration after erasure or withdrawal."
      ],
      "limitations": [
        "Representative asset creation is verified in native Blender and the photo workflow. App 3D selectors, browser model performance and all eight route-specific compatibility checks remain separate pending implementation tasks.",
        "Catalog currently contains eleven hair and five beard assets. Ample catalog expansion remains task 15; approximately 40/20 are planning targets. Professional acceptance and final route choice remain pending.",
        "Smooth synthetic portraits and simulated follow-up images demonstrate workflow, not real reconstruction likeness or actual haircut accuracy. Ground-truth synthetic meshes are excluded from candidate inputs.",
        "Optional Blender MeshOptimizer library is unavailable; uncompressed GLB export/import passed. Existing multi-texture sampler warning needs browser evaluation in the shared workspace."
      ],
      "verification": [
        {
          "command": "ZipFile.testzip and SHA-256",
          "result": "Passed: 47,586,229-byte FLAME2023Open.zip, SHA-256 a6b4c3dc15d569d98136a1e548b6fe532eb2830ca12a4f0d4b3a5dba8ee87a91; exact flame2023_Open.pkl present."
        },
        {
          "command": "MPFB v2.0.17 in isolated Blender 5.2.1 profile",
          "result": "Initial extension setup failed on renamed operator arguments; corrected to custom_directory with LOCAL repository. Rerun passed and generated 19,158-vertex base human with 18,486 polygons in private smoke.blend."
        },
        {
          "command": "Offline Blender render.py neutral mannequin export",
          "result": "Created real normalized GLB: 4,913 head vertices / 4,869 polygons plus independent eye mesh. Front render visually inspected. Exporter reports unavailable optional MeshOptimizer library; uncompressed GLB export succeeds. Multi-image sampler warning remains for eye material; browser verification pending."
        },
        {
          "command": "Procedural beard render inspection",
          "result": "Five independent real GLB meshes exported, but stubble and moustache coverage reaches too high near the nose. Marked intermediate failure; correcting lip landmark and sampling boundaries before asset verification."
        },
        {
          "command": "Fictional Alex baseline render visual check",
          "result": "Failed intermediate appearance check: half-quad strand sampling left unnatural triangular gaps. No demo case imported into app yet; all outputs remain private and replaceable."
        },
        {
          "command": "Offline Blender verify-interchange.py initial run",
          "result": "16 style GLBs imported with finite geometry, metre-scale bounds and materials. Independent beard changes preserved hair fingerprint. Clean-shaven retained current hair. Selection saved to .blend and reopened with the same four meshes. Repeat underway for refined beard geometry."
        },
        {
          "command": "Measured refined beard render run",
          "result": "22.197 seconds wall time, 243.518 CPU seconds, peak child RSS 1,551,012 KiB. Cycles CPU 32 samples, 768 x 896. Total private asset workspace at measurement 256,611,460 bytes; includes retained intermediate scenes and client renders."
        },
        {
          "command": "Offline Blender verify-interchange.py refined run",
          "result": "Passed all 16 current style GLB imports. Hair fingerprint identical after beard switch and clean-shaven; saved selection reopened with four meshes. Candidate-specific clipping, app browser load and browser performance still pending."
        },
        {
          "command": "populate.py then second populate.py run",
          "result": "Passed: all 72 content hashes matched retained originals on second run, all nine sets reopened with eight labels and zero missing required views. No duplicated clients or photos on repeat."
        },
        {
          "command": "verify-import-guards.py against live local API",
          "result": "Passed actual disposable media erasure, permission withdrawal and client erasure. Each subsequent importer run failed explicitly; client lists unchanged, erased media absent, retained demo cases untouched."
        },
        {
          "command": "In-app browser Maya baseline and reload",
          "result": "Baseline selector displayed six coherent main views plus optional details. Reload retained three sets and eight loaded 768-pixel images. First DOM check used incorrect class selector and found zero matches; inspected source and corrected to actual #guided-photos ID. No app loading defect observed."
        },
        {
          "command": "Three-case measured rendering",
          "result": "Passed: 244.843 seconds wall time, 2,998.161 CPU seconds, peak child RSS 1,683,828 KiB; 72 renders at 768 x 896, Cycles CPU 32 samples. Private asset workspace including source scene outputs: 371,935,155 bytes."
        },
        {
          "command": "go test ./... and npm --prefix web run build",
          "result": "Passed Go suite (cached unchanged app source) and TypeScript/Vite production build. Asset scripts compile, native GLB checks and live synthetic persistence/refusal flows passed."
        }
      ],
      "pictures": [
        {
          "src": "assets/flame-open-license.png",
          "caption": "Exact Open model agreement inspected before user accepted download. Academic model and texture licenses are separate.",
          "date": "2026-09-29T23:02:05-03:00"
        },
        {
          "src": "assets/mannequin-intermediate.png",
          "caption": "Intermediate synthetic clay mannequin with real eye geometry. Hairstyle and beard libraries and cross-route compatibility remain in progress.",
          "date": "2026-09-29T23:08:44-03:00"
        },
        {
          "src": "assets/beard-placement-intermediate.png",
          "caption": "Rejected intermediate beard placement. Synthetic mannequin, left to right: stubble, full, goatee, moustache, chinstrap. Upper-face coverage requires correction; these are not accepted catalog outputs.",
          "date": "2026-09-29T23:12:34-03:00"
        },
        {
          "src": "assets/coily-mannequin.png",
          "caption": "Locally generated reusable rounded coil geometry on the shared synthetic mannequin. Professional acceptance pending.",
          "date": "2026-09-29T23:24:06-03:00"
        },
        {
          "src": "assets/beard-stubble-refined.png",
          "caption": "Stubble after sampling complete polygons and applying point-level boundaries. Independent real mesh; professional acceptance pending.",
          "date": "2026-09-29T23:24:06-03:00"
        },
        {
          "src": "assets/synthetic-case-browser.png",
          "caption": "Maya synthetic baseline in running local app with six coherent labeled views; captures and expected/follow-up sets are explicitly synthetic or simulated.",
          "date": "2026-09-29T23:30:17-03:00"
        }
      ],
      "commits": [
        "2b529a7d014b399e700e6e6916c94a8d6b3e85ba"
      ],
      "outputs": [
        {
          "href": "assets/flame-open-provenance.json",
          "label": "FLAME 2023 Open acquisition and license provenance"
        },
        {
          "href": "assets/makehuman-core-provenance.json",
          "label": "Core MakeHuman and MPFB license and acquisition metadata"
        },
        {
          "href": "assets/representative-asset-metadata.json",
          "label": "Representative hair/beard mesh metadata, licenses, filters and limitations"
        },
        {
          "href": "assets/asset-interchange-results.json",
          "label": "Actual GLB import, independent selection and saved reopen results"
        },
        {
          "href": "assets/synthetic-cases-provenance.json",
          "label": "Fictional case histories, view labels, generation licenses and limitations"
        },
        {
          "href": "assets/asset-resource-results.json",
          "label": "Measured rendering settings, wall time, CPU use, memory and retained sizes"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T22:52:20-03:00",
          "text": "Starting shared asset acquisition and creation. Current colored squares are diagnostics only and will not be used as portrait inputs or 3D accuracy evidence."
        },
        {
          "date": "2026-09-29T23:02:05-03:00",
          "text": "User accepted FLAME 2023 Open terms. Download prerequisite satisfied; loading and fitting are not yet verified."
        },
        {
          "date": "2026-09-29T23:06:00-03:00",
          "text": "Official sample asset-pack URL returned 404; located current official /assets/assetpacks page. Core CC0 asset pack downloading; no third-party assets treated as automatically CC0."
        },
        {
          "date": "2026-09-29T23:08:44-03:00",
          "text": "Ten core hairstyle meshes now being fitted, exported and rendered on the same shared mannequin. Tile labels and appearance still require inspection."
        },
        {
          "date": "2026-09-29T23:17:36-03:00",
          "text": "Fictional-case rendering paused after inspection found triangular bare patches in beard coverage. Cause: strands sampled only the first triangle of each quad. Corrected to area-weighted sampling across the complete polygon fan; rerendering catalog before rebuilding cases."
        },
        {
          "date": "2026-09-29T23:31:09-03:00",
          "text": "Verified representative asset milestone, not completion of 3D product features or comparative candidates. Preserving all remaining requirements and professional review as pending."
        }
      ]
    },
    {
      "id": "06",
      "title": "Persistent shared comparison workspace",
      "depends": [
        "05"
      ],
      "requirement": "Shared candidate selector, job states and synchronized current/proposed viewer.",
      "criteria": [
        "All eight candidates remain selectable with inputs, settings, status, outputs and evidence.",
        "Real processing jobs, cancellation, failure and restart/reopen behavior; no canned success.",
        "Synchronized rotation/zoom and consistent named angles; independent styles and option persistence."
      ],
      "status": "verified",
      "changes": [
        "Implemented shared authenticated library, optimistic workspace persistence, immutable explored mannequin options and six-view input-check jobs. Candidate-specific head processing remains pending.",
        "Saved workspace/options now snapshot owned photo assignments. Replacing a live view preserves earlier explorations; erasing an old snapshot source clears dependent options, workspace and jobs without deleting the replacement.",
        "Centered the generic mannequin camera and increased default/reset distance to 1.3 m after rounded coils touched the top of the closer viewport. Added mobile navigation access to demos and complete Portuguese labels for the new controls.",
        "Verified the shared workspace foundation. All eight candidates are selectable; three fictional cases each retain actual six-photo diagnostics and a saved independent mannequin exploration. Full candidate processing and complete journeys remain explicitly pending in their separate tasks.",
        "Code-split Three.js/demo UI so normal client pages retain a 414.71 kB entry bundle; viewer code loads when opening demos. Default/reset mannequin framing is centered at 1.3 m."
      ],
      "limitations": [
        "Candidate-specific fitting/reconstruction, client-specific geometry, direct editing, expected-result selections and full comparative demos remain pending in tasks 07a-14a, 16, 17 and full candidate checks 07-14.",
        "Representative catalog is 11 hairstyles and 5 beardstyles. Expanded variety and natural beard edge refinement remain in task 15; professional acceptance is pending.",
        "Uncompressed assets total 91 MB for the 16 styles; dense beards can exceed 210k triangles. Initial frame rates are short local observations, not sustained performance guarantees. Deferred Three.js bundle retains the Vite size warning.",
        "In-app viewport override did not apply; desktop browser behavior is verified, narrow-screen behavior is not yet verified. One old QuillBot extension console error was observed; no application error was observed during these viewer checks."
      ],
      "verification": [
        {
          "command": "go test ./internal/app -run Demo -count=1",
          "result": "Passed: persistence, access, decoding failure, cancellation, restart interruption, non-front erasure and late-publication guards."
        },
        {
          "command": "go test -race ./internal/app -run 'Demo|Privacy|Permission|Guided' -count=1",
          "result": "Passed under race detector."
        },
        {
          "command": "python3 scripts/verify-local-demos.py",
          "result": "Passed on running loopback app: read 91,075,372 bytes of 16 real GLBs; verified six metrics, identical-image warnings, snapshot replacement/reopen, conflict, non-front erasure, cancellation, withdrawal and fixture cleanup."
        },
        {
          "command": "go test ./...",
          "result": "Passed for all packages after shared demo changes."
        },
        {
          "command": "go test -race ./internal/app -run Demo -count=1",
          "result": "Passed for all demo tests, including original snapshot erasure after later replacement."
        },
        {
          "command": "npm --prefix web run build",
          "result": "Passed: 181 modules; entry 414.71 kB (131.74 kB gzip), deferred demos 659.05 kB (167.72 kB gzip). Vite still warns about the deferred Three.js chunk over 500 kB."
        },
        {
          "command": "@Browser shared workspace flow",
          "result": "All 16 real style GLBs loaded without app alerts. Named angle and zoom controls produced identical actual cameras. Keep-current, independent beard, clean-shaven, filters, saved option reopen and reload passed. All eight selectors passed; supporting dependencies explicitly labeled. Withdrawn client rendered zero input photos and zero canvases."
        },
        {
          "command": "python3 scripts/demo-assets/populate-workspaces.py",
          "result": "24 retained real input checks, six original source views each; 24 saved mannequin options; no candidate head processing claimed. Known removed assets/options are refused rather than recreated."
        },
        {
          "command": "go test -race ./internal/app -run Demo -count=1",
          "result": "Passed after adding queued-restart verification: queued jobs resume with original inputs; interrupted running jobs become failed; completed work reopens."
        },
        {
          "command": "python3 scripts/demo-assets/populate-workspaces.py (second run)",
          "result": "Passed without creating extra jobs/options or changing saved workspace. All 24 stored input checks and original source IDs verified again."
        },
        {
          "command": "Portable HTML log: local file references plus loopback HTTP and @Browser selector",
          "result": "41 relative picture/output links exist and returned HTTP 200. Full browser reload and selector showed the current six verified milestones and all added processing/full-demo tasks."
        },
        {
          "command": "npm --prefix web run build (final formatted source)",
          "result": "Passed: entry 414.71 kB (131.73 kB gzip), deferred demos 659.07 kB (167.73 kB gzip), 181 modules, 1.44 s. Deferred Three.js chunk warning remains."
        }
      ],
      "pictures": [
        {
          "src": "assets/demo-workspace-intermediate.png",
          "caption": "2026-09-30: all eight selectors, six coherent Maya inputs, synchronized real GLB inspection and actual input job running. Head geometry is explicitly generic, not a client reconstruction.",
          "date": "2026-09-30T00:09:03-03:00"
        },
        {
          "src": "assets/demo-independent-styles.png",
          "caption": "2026-09-30: actual rounded-coil GLB in both views, independent goatee only in proposal, synchronized front angle and 1.09 m zoom. Both actual camera measurements agree. Beard silhouette refinement and professional acceptance remain pending.",
          "date": "2026-09-30T00:16:36-03:00"
        },
        {
          "src": "assets/demo-portuguese-framing.png",
          "caption": "2026-09-30: Portuguese synchronized viewer with corrected default framing and ample room above the rounded coils. This capture is desktop width; the attempted viewport override did not apply.",
          "date": "2026-09-30T00:28:45-03:00"
        },
        {
          "src": "assets/demo-support-dependency.png",
          "caption": "2026-09-30: CloudCompare selector explicitly identifies its required upstream reconstruction/fitting dependency and pending candidate stage.",
          "date": "2026-09-30T00:28:45-03:00"
        },
        {
          "src": "assets/demo-withdrawn-client.png",
          "caption": "2026-09-30: withdrawn baseline client cannot open private demo inputs or saved work. DOM check: zero input images and zero 3D canvases.",
          "date": "2026-09-30T00:40:35-03:00"
        },
        {
          "src": "assets/demo-input-verification.png",
          "caption": "2026-09-30: actual 768x896 six-view metrics, hashes and completed retained report. An additional input check is running asynchronously; neither is presented as reconstruction.",
          "date": "2026-09-30T00:40:35-03:00"
        }
      ],
      "commits": [
        "81ba3ea"
      ],
      "outputs": [
        {
          "href": "assets/three-provenance.json",
          "label": "Three.js and type definitions: pinned versions and full MIT notices"
        },
        {
          "href": "assets/browser-asset-checks.json",
          "label": "Actual browser load/mesh counts/bytes/initial frame rates for 11 hairstyles and 5 beards"
        },
        {
          "href": "assets/browser-candidate-checks.json",
          "label": "All eight selector checks, including explicit upstream dependencies for supporting components"
        },
        {
          "href": "assets/shared-demo-population-results.json",
          "label": "24 real shared six-input checks and preserved mannequin explorations; all candidate head processing remains pending"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T23:32:01-03:00",
          "text": "Starting authenticated local comparative workspace. Shared assets and fictional baseline sets are ready; reconstruction/fitting routes remain distinct pending tasks. No route is presented as successful until it actually processes inputs."
        },
        {
          "date": "2026-09-30T00:09:03-03:00",
          "text": "First browser check: actual head and hair GLBs loaded in both WebGL scenes; shared neutral geometry visibly rendered. Input check progressed asynchronously. Styling, rotation, reload and deletion verification continues."
        },
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Browser viewport override requested 390x844 but the in-app browser remained 1658px wide. No mobile verification claim is made. Reset override. One English Language locator failed after changing to Portuguese; fresh DOM identified Idioma and verification continued."
        },
        {
          "date": "2026-09-30T00:40:35-03:00",
          "text": "Updated dependencies: native processing milestones precede shared direct editing/history, and complete candidate verification follows them. This removes the earlier circular dependency while retaining every approved full-demo requirement."
        },
        {
          "date": "2026-09-30T00:46:38-03:00",
          "text": "The browser log tab initially retained an older loaded page during hash-only navigation. A full reload and Task selector verified the current log; commit hashes remain local text, not broken remote links."
        }
      ]
    },
    {
      "id": "07a",
      "title": "Blender + MPFB processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Fit shared photos using actual MPFB, explicit cameras, landmarks and bounded render iterations. Retain actual processing success or failure; the full candidate journey remains in task 07.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Actual offline MPFB target fitting script now reads six input photos, detects image-plane landmarks, optimizes bounded facial targets and exports a separate fitted head plus 11 hair and five beard meshes.",
        "Native job integration queues real processing, retains camera assumptions and diagnostic files, snapshots all six source dependencies, and serves artifacts only to the authorized studio with active permission.",
        "All three fictional cases now have real, distinct MPFB fitted heads and saved independent-style explorations. Repeated seeding retains the same job/option IDs and does not overwrite current workspace selections.",
        "Processing uses kernel network isolation, a private process group, parent-death protection for runner and native stages, and an OS thread held for the child lifetime. Both direct fitting CLIs and the API enforce network isolation."
      ],
      "limitations": [
        "First synthetic-only probe matched 56 landmarks in front and two three-quarter views; both profiles and back had no paired detections. Entire 3D surface remains a fitted or inferred MPFB prior. Pixel error does not prove likeness.",
        "Initial synthetic-only CLI probe preceded network isolation. MediaPipe 1.0.1 NOTICE describes utilization metrics; integrated app processing now uses an isolated Linux network namespace.",
        "Alex and Maya used 56 paired landmarks in three views; Noah used 37 in two views. Both profile views and back remain unobserved by this face detector. The fitted heads visibly retain strong generic-prior influence; likeness remains unverified.",
        "No texture likeness is fitted. Hair and beard references remain manually chosen. Goatee boundaries and dense stubble still need catalog-quality refinement. Full editing, expected-result selection/revision history and complete candidate demos remain pending in their existing tasks.",
        "Peak RSS is the cumulative maximum child-process memory through each stage, not isolated stage memory. Landmark pixel error is after framing translation and fixed neutral correspondence offsets; neither metric establishes likeness.",
        "Later task 10a investigation found that the original optimization basis omitted target unit/axis conversion. Historical outputs are retained, with a corrected and reverified implementation required in task 07b. Previous technical evidence does not establish correct target optimization."
      ],
      "verification": [
        {
          "command": "Initial retained mpfb-alex-six experiment",
          "result": "Prepare 24.090 s, fit 2.501 s, export 26.966 s; 53.560 s total; 107758627 retained bytes; 97 evaluations across four iterations; mean image landmark error 2.770 pixels; all native stages exited 0."
        },
        {
          "command": "go test ./... first native integration attempt",
          "result": "Failed: persisted default camera settings changed the expected test fixture. Corrected fixture to explicitly include the saved defaults; subsequent full suite passed."
        },
        {
          "command": "Native subprocess erasure test first attempt",
          "result": "Failed HTTP 400 because the test omitted the required confirmed deletion body. Corrected the test and verified whole-process-group termination before directory purge; no directory recreation."
        },
        {
          "command": "go test ./... after corrections",
          "result": "Passed all packages, including native validation, rejecting diagnostics as heads, and killing a real writing subprocess when a non-front input is erased."
        },
        {
          "command": "npm --prefix web run build intermediate native UI edit",
          "result": "Failed: the fitted catalog prop was missing its TypeScript declaration. Added the declaration, retained existing formatting, and rebuilt successfully."
        },
        {
          "command": "Native verification immediately after server restart",
          "result": "First request was refused before Go compilation finished. Waited for HTTP health readiness before retrying."
        },
        {
          "command": "Native verification with multiple completed fits",
          "result": "Initial test incorrectly expected the newest run to replace the saved selection. Corrected verification to inspect the retained chosen run; the app correctly preserved its earlier selection."
        },
        {
          "command": "Full final MPFB pipeline with network and parent-death safeguards",
          "result": "Completed in 51868 ms, 56 paired landmarks, 11 hair variants and five beard variants; repeated head.glb SHA256 identical to the previous fit of the same inputs."
        },
        {
          "command": "python scripts/native-demos/verify-parent-death.py",
          "result": "Passed: killing the launcher abruptly terminated the actual native runner and Blender stage; no app/client state changed."
        },
        {
          "command": "python scripts/native-demos/verify-local.py",
          "result": "Passed actual 17 fitted GLB reads, anonymous 401/unlisted path 404, fitted workspace and option reopening, actual no-face processing failure without fallback, live nonfront erasure during processing, no recreated directory, and withdrawal denial. Disposable fixture deleted."
        },
        {
          "command": "python scripts/native-demos/populate.py blender-mpfb, repeated",
          "result": "Passed three real synthetic fits and preserved previously retained job/option IDs. All eight full candidate journeys remain pending."
        },
        {
          "command": "python scripts/verify-local-demos.py",
          "result": "Passed existing shared-workspace and input diagnostics regression checks after native integration."
        },
        {
          "command": "go test ./... final native source",
          "result": "Passed all packages."
        },
        {
          "command": "go test -race ./internal/app (Native, Demo, Privacy and Permission)",
          "result": "Passed selected consequential behavior tests in 3.050 s."
        },
        {
          "command": "npm --prefix web run build final native UI",
          "result": "Passed 181 modules in 1.51 s; deferred demo chunk 665.40 KB with the existing size warning retained as a performance limitation."
        },
        {
          "command": "Final browser native workflow",
          "result": "All 11 hair and five beard mesh variants rendered on the actual fitted head; independent selection, synchronized front/profile camera, saved option reopening and workspace reload verified. Legacy options show declared 70 mm, 1.6 m, 0.04 m, four-round defaults. No app alert or new app console error; one earlier unrelated extension error remains in browser logs."
        },
        {
          "command": "Latest running API invalid setting boundary",
          "result": "Explicit zero focal length rejected HTTP 400 before native processing. Loopback service is running the latest source."
        },
        {
          "command": "Portable HTML log validation",
          "result": "All 55 then-linked relative pictures and retained outputs existed and returned HTTP 200; task selector and verified scoped entry loaded in the in-app browser. No model weights, source photo library, databases or credentials staged."
        }
      ],
      "pictures": [
        {
          "src": "assets/mpfb-running.png",
          "caption": "Actual MPFB process running at 5%; shared input checks are separately labeled.",
          "date": "2026-09-30T01:59:26-03:00"
        },
        {
          "src": "assets/mpfb-fitted-profile.png",
          "caption": "Synchronized profile inspection of the actual fitted head with independent current/proposed meshes; hidden surfaces remain inferred and beard boundaries need refinement.",
          "date": "2026-09-30T01:59:26-03:00"
        },
        {
          "src": "assets/mpfb-six-view-evaluation.png",
          "caption": "Six synthetic input views beside untextured fitted geometry. Three views supplied paired landmarks; both profiles and back did not. This is not real-person reconstruction accuracy or haircut evidence.",
          "date": "2026-09-30T01:59:26-03:00"
        },
        {
          "src": "assets/mpfb-final-front.png",
          "caption": "Final browser view of the retained synthetic Alex fitted head with independently refitted current/proposed hair and beard; direct editing and expected-result selection remain pending.",
          "date": "2026-09-30T02:01:57-03:00"
        },
        {
          "src": "assets/mpfb-final-evidence.png",
          "caption": "Completed actual six-view MPFB experiment with explicit fitted/inferred geometry labels, framing-aligned landmark error and retained diagnostic evidence.",
          "date": "2026-09-30T02:01:57-03:00"
        },
        {
          "src": "assets/mpfb-fitted-comparison.png",
          "caption": "Intermediate browser render of the actual fitted head and independent style meshes before the final labeling and viewport capture corrections. Final screenshots below provide the complete inspection view.",
          "date": "2026-09-30T02:03:53-03:00"
        }
      ],
      "commits": [
        "fec6ce29c8e26df44e9f90d73d9e49688ddef904"
      ],
      "outputs": [
        {
          "href": "assets/native-mpfb-provenance.json",
          "label": "Exact native runtime, model sources, hashes, licenses and bundled notices"
        },
        {
          "href": "assets/mpfb-fit-results.json",
          "label": "Three actual fit reports, coverage, resource use and distinct head hashes"
        },
        {
          "href": "assets/mpfb-populated-native-results.json",
          "label": "Retained fictional-case processing and saved option results"
        },
        {
          "href": "assets/mpfb-live-verification.json",
          "label": "Actual native API, failure, privacy and cancellation verification"
        },
        {
          "href": "assets/mpfb-browser-style-checks.json",
          "label": "Actual browser loading of all sixteen fitted style variants"
        },
        {
          "href": "assets/mpfb-parent-death-check.json",
          "label": "Abrupt-shutdown native process verification"
        },
        {
          "href": "assets/mpfb-final-pipeline-check.json",
          "label": "Reproduced final native processing settings and results"
        },
        {
          "href": "http://127.0.0.1:8080/demos?client=a0b730e5-490f-488d-ae16-4f3812ee044f",
          "label": "Reopen the retained fitted exploration in the local app"
        },
        {
          "href": "assets/makehuman-core-provenance.json",
          "label": "Exact Blender and MPFB versions, GPL code and separate CC0 core asset/target provenance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 07."
        },
        {
          "date": "2026-09-30T00:47:04-03:00",
          "text": "Beginning actual MPFB six-photo fitting with explicit cameras/landmarks and bounded iterations. Shared mannequin asset generation from task 05 is not counted as a client fit. Full demo verification remains pending in task 07 after direct editing and expected-selection history."
        },
        {
          "date": "2026-09-30T01:29:32-03:00",
          "text": "Native workflow implemented; app/browser verification and local milestone commit remain pending."
        },
        {
          "date": "2026-09-30T02:01:57-03:00",
          "text": "Native experiment technical checks passed. Professional likeness/style assessment and the full candidate journey remain pending."
        },
        {
          "date": "2026-09-30T02:02:34-03:00",
          "text": "Verified the scoped native processing experiment. Full Blender demo task 07 stays pending until client editing, expected-result history and complete journey verification are delivered."
        },
        {
          "date": "2026-09-30T02:04:10-03:00",
          "text": "Local verified milestone committed as fec6ce29c8e26df44e9f90d73d9e49688ddef904; no push or deployment."
        },
        {
          "date": "2026-09-30T06:51:45.261508+00:00",
          "text": "Coordinate-basis regression discovered through independent native MakeHuman comparison; task 07b now repairs and verifies actual deformation against its optimization basis."
        }
      ]
    },
    {
      "id": "07b",
      "title": "Repair MPFB target units and verify actual applied geometry",
      "depends": [
        "07a"
      ],
      "requirement": "Correct the discovered target coordinate-basis error before native comparison milestones advance. Preserve historical options and selection history; label their limitation.",
      "criteria": [
        "Convert raw MakeHuman target offsets from decimetres and Y up to the exported head metres and Z up, including crown recentering.",
        "Every corrected completed MPFB experiment checks predicted target geometry against actual MPFB-applied vertices and retains the measured error.",
        "Run corrected six-photo cases, actual native fitting/failure/privacy checks, app checks and browser inspection. Retain original experiments and clearly flag their basis limitation."
      ],
      "status": "verified",
      "changes": [
        "Corrected raw CC0 target offsets from native MakeHuman X/Y/Z decimetres into MPFB X/-Z/Y metres and included the actual crown recentering translation. Each export now directly compares its optimization-basis prediction with actual MPFB-evaluated target vertices, refusing completion above 10 micrometres of error.",
        "Corrected fitting has the explicit mpfb-metre-z-up-v2 basis version. Historical jobs and options remain retained and receive a visible limitation notice; new corrected population uses a separate checkpoint and new options, preserving prior history."
      ],
      "limitations": [
        "Historical MPFB fitted experiments lack the corrected basis and must not be counted as corrected fitting evidence. Professional likeness remains pending."
      ],
      "verification": [
        {
          "command": "Source coordinate inspection",
          "result": "MPFB TargetService._target_string_to_shape_key_info rotates X/Y/Z to X/-Z/Y; _set_shape_key_coords_from_dict multiplies by the human scale factor. Native source and the generated basis confirmed the missing conversion in the earlier experiment."
        },
        {
          "command": "Corrected native failure, artifact access, persistence and erasure verification",
          "result": "Passed against actual corrected Alex head e90fa4b1-492c-4b76-af70-dd96257bdb84. All 17 fitted artifacts read; chosen option persisted/reloaded; original current exploration restored; no-face fitting failed without a head; deletion cancelled real native processing and purged outputs; withdrawal denied earlier diagnostics."
        },
        {
          "command": "Corrupted MPFB basis rejection experiment",
          "result": "Passed: injected 20 mm prediction offset produced a failed direct native check, nonzero Blender exit and no exported head. All three positive checks measured 0.12 to 0.17 micrometres maximum error against actual MPFB application."
        },
        {
          "command": "Exact staged-index go test ./...",
          "result": "Passed independently in the exported staged checkout, including internal/app in 0.701 s."
        },
        {
          "command": "Exact staged-index npm --prefix web run build",
          "result": "Passed after correcting the staging-only JSX extraction. Demo chunk remains about 670 kB with the existing size warning."
        },
        {
          "command": "go test -race ./internal/app -run Native/Demo/Colmap/Privacy/Permission",
          "result": "Passed in the working app in 3.255 s."
        },
        {
          "command": "Browser corrected MPFB inspection",
          "result": "All 16 actual fitted styles loaded against the corrected Alex job. Corrected option saved; historical outputs display the explicit units/axes limitation. Reload and exact-staged-source native repeat are in progress."
        },
        {
          "command": "Browser-queued exact-staged-source MPFB repeat",
          "result": "Passed: completed native run 1a6726d4-004a-499c-bbd9-8721a1f3308a produced a byte-identical head to corrected Alex e90fa4b1-492c-4b76-af70-dd96257bdb84. Actual applied target check passed; saving and reload retained the corrected option and did not choose the new run automatically."
        },
        {
          "command": "Local progress-log link verification",
          "result": "75 relative pictures/outputs loaded with HTTP 200 before adding the final repeat evidence links. One authenticated local app link is intentionally separate from portable assets. The first audit incorrectly treated that app URL as a relative file and failed; corrected classification passed."
        }
      ],
      "pictures": [
        {
          "src": "assets/mpfb-historical-basis-notice.png",
          "caption": "2026-09-30: original MPFB experiment retained with an explicit warning about its incorrect optimization units and axes; history is preserved.",
          "date": "2026-09-30T04:09:01-03:00"
        },
        {
          "src": "assets/mpfb-corrected-comparison.png",
          "caption": "2026-09-30: actual corrected MPFB head with independently refitted current and proposed hair/beard meshes; synthetic input and professional likeness review remains pending.",
          "date": "2026-09-30T04:09:01-03:00"
        },
        {
          "src": "assets/mpfb-corrected-native-validation.png",
          "caption": "2026-09-30: native repeat using the exact staged source completed; 4,701 directly checked vertices differ by at most 0.17 micrometres from the optimizer prediction. This verifies target application, not likeness.",
          "date": "2026-09-30T04:11:04-03:00"
        }
      ],
      "commits": [
        "ef786c1"
      ],
      "outputs": [
        {
          "href": "assets/mpfb-corrected-basis-verification.json",
          "label": "Actual target application checks for three cases and deliberate corruption rejection"
        },
        {
          "href": "assets/mpfb-corrected-live-verification.json",
          "label": "Corrected head authorization, persistence, failure, cancellation and erasure checks"
        },
        {
          "href": "assets/mpfb-populated-corrected-results.json",
          "label": "Three retained corrected MPFB experiments and populated explored options"
        },
        {
          "href": "assets/mpfb-corrected-browser-style-checks.json",
          "label": "All 16 corrected fitted styles loaded in the browser"
        },
        {
          "href": "assets/mpfb-corrected-staged-repeat.json",
          "label": "Exact staged-source browser repeat, actual target checks and repeat head checksum"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T06:51:45.261508+00:00",
          "text": "Begin focused dependency repair; task 10a is paused pending this verified local milestone."
        },
        {
          "date": "2026-09-30T03:54:14-03:00",
          "text": "Corrected three-case native reruns are in progress. Current MakeHuman task 10a remains pending until this dependency repair is verified and committed."
        },
        {
          "date": "2026-09-30T03:57:46-03:00",
          "text": "All three corrected MPFB runs completed, preserving original jobs/options. Direct prediction-versus-native application passed with sub-micrometre vertex errors. During shared verifier generalization, its old fixed output path overwrote the previous evidence JSON. The corrected run evidence was retained under mpfb-corrected-live-verification.json, the original committed evidence restored, and output paths are now candidate-specific. The MakeHuman verifier will run again for its own retained evidence after this repair milestone."
        },
        {
          "date": "2026-09-30T04:05:01-03:00",
          "text": "The focused repair is staged separately from paused MakeHuman app code. An exported copy of exactly the staged index caught a truncated JSX insertion in the staging script, while the working app source remained valid. The staged insertion was corrected; this exact-index frontend and Go verification is being rerun before committing."
        },
        {
          "date": "2026-09-30T04:11:04-03:00",
          "text": "Dependency repair is technically verified. The current fictional Alex browser fixture opens its corrected MPFB option after QA; all original experiments/options remain retained with visible limitations. This is a reversible inspection state, not professional acceptance or a final route selection. MakeHuman 10a remains pending until the repair commit is made."
        },
        {
          "date": "2026-09-30T04:12:06-03:00",
          "text": "Local repair milestone committed as ef786c1; no push or deployment. Proceeding back to MakeHuman after the dependency repair."
        }
      ]
    },
    {
      "id": "08a",
      "title": "COLMAP / PyCOLMAP processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Reconstruct the agreed six photos through real COLMAP processing. Retain actual processing success or failure; the full candidate journey remains in task 08.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "failed",
      "changes": [
        "Installed official PyCOLMAP 4.2.1 CPU wheel privately with retained BSD-3-Clause notice and registry distribution hashes. SIFT uses no learned model.",
        "Added a real isolated COLMAP route: six copied source snapshots, CPU SIFT, exhaustive geometric matching, three bounded sparse mapping trials, native database retention and actual verified-match graph. Standard and sensitive declared-calibration presets are persisted."
      ],
      "limitations": [
        "All six retained case/preset experiments and the browser repeat produced zero sparse models. The COLMAP route failed the head coverage and editable-head requirements on these synthetic six-view inputs. This does not establish failure on every real-person capture.",
        "Dense reconstruction was not run because no sparse model was available. The available RTX 4050 was not used; installing the separate CUDA runtime would require its own license acceptance if a later sparse reconstruction makes dense evaluation meaningful.",
        "No native head exists for compatible style fitting, clipping or 3D browser-performance measurement. Generic mannequin inspection remains explicitly separate and is not counted as candidate success. Current-hair/beard separation, refinement, expected selection and the full task 08 journey are unmet.",
        "Declared calibration assumes shared 36 mm sensor, square pixels, centered principal point and no distortion. It is not measured calibration. Synthetic clay input texture and six-view overlap limit these results; no extra capture or ground-truth geometry was substituted.",
        "Feature counts were stable in the browser repeat; verified-match counts varied slightly despite the declared random seed. No bitwise repeatability or reconstructed likeness is claimed. Peak RSS is cumulative process memory, not isolated per-stage memory."
      ],
      "verification": [
        {
          "command": "Initial Alex standard and sensitive CLI experiments",
          "result": "Both extracted actual features and attempted all 15 pairs and three mapping trials. Neither retained a sparse model. Native databases and logs remain private."
        },
        {
          "command": "Initial go test ./... after adding COLMAP state",
          "result": "Failed workspace persistence fixture comparison because its expected state omitted the new default standard preset. Corrected fixture to include the documented default; rerun pending."
        },
        {
          "command": "go test ./...",
          "result": "Passed after normalizing the persistence fixture to the documented standard preset; internal/app completed in 0.764 seconds."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app -run 'Native|Demo|Colmap|Privacy|Permission'",
          "result": "Passed in 3.273 seconds. Includes real subprocess termination-before-purge, failed reconstruction publication, failed-head selection rejection and dependent erasure."
        },
        {
          "command": "npm --prefix web run build",
          "result": "Passed, 181 modules. Demos chunk 669.57 kB / 170.20 kB gzip, existing size warning remains. This is not a mobile performance measurement."
        },
        {
          "command": "python scripts/native-demos/populate.py colmap with both presets, then repeat",
          "result": "Three fictional clients times two presets, six real native experiments and eighteen mapping trials. All zero sparse models. Repeat reused retained failed runs without creating jobs or restoring removed material."
        },
        {
          "command": "python scripts/native-demos/verify-colmap.py",
          "result": "Passed twice. Latest check waited for actual SIFT extractor startup before deleting the back source. Process output vanished, result cleared, no directory recreation, private/anonymous artifact denial, actual PNG decode and withdrawal verified."
        },
        {
          "command": "Browser COLMAP selector, save workspace, reload and run reconstruction",
          "result": "Sensitive preset, focal length 70 mm and original six source assignments survived reload. Browser button started actual running job 3735c097-2b42-4132-9fba-266a435d02cd, then displayed native failure, true features, match graph and three zero-model trials."
        },
        {
          "command": "Source-image SHA-256 comparison against native MPFB runs",
          "result": "Every original six-photo source hash matched for all three cases in both presets. No denser capture, learned model, ground-truth mesh or case morph values used."
        },
        {
          "command": "Portable evidence HTTP and browser checks",
          "result": "All 64 relative retained pictures/output links exist and returned HTTP 200. Browser task selector renders task 08a as failed and shows the retained evidence. Restored Alex’s previously chosen MPFB model and original independent styles after testing COLMAP settings."
        },
        {
          "command": "HTML log updater after milestone",
          "result": "Whitespace in the JavaScript assignment broke the CLI parser during commit recording. Updated the parser to validate the assignment and parse its JSON independent of whitespace; actual commit recording succeeded."
        }
      ],
      "pictures": [
        {
          "src": "assets/colmap-controls.png",
          "caption": "2026-09-30: COLMAP selector and the six original synthetic views. The native reconstruction controls are below this viewport; shared mannequin inspection is not credited as COLMAP output.",
          "date": "2026-09-30T02:39:01-03:00"
        },
        {
          "src": "assets/colmap-failed-result.png",
          "caption": "2026-09-30: actual browser-started COLMAP failure, retained native evidence and explicit absence of a sparse model. Dense processing did not run because its sparse prerequisite failed.",
          "date": "2026-09-30T02:39:01-03:00"
        },
        {
          "src": "assets/colmap-match-graph-app.png",
          "caption": "2026-09-30: authenticated retained match graph loaded at 1200 by 820 pixels. Counts are verified feature matches, not measured surface coverage or likeness.",
          "date": "2026-09-30T02:39:01-03:00"
        }
      ],
      "commits": [
        "d2acc07a521e915bc4584dc991248539500aaa0f"
      ],
      "outputs": [
        {
          "href": "assets/colmap-provenance.json",
          "label": "Exact PyCOLMAP software license and acquisition provenance"
        },
        {
          "href": "assets/colmap-populated-standard.json",
          "label": "Three retained standard SIFT experiments"
        },
        {
          "href": "assets/colmap-populated-sensitive-calibrated.json",
          "label": "Three retained sensitive declared-calibration experiments"
        },
        {
          "href": "assets/colmap-shared-input-check.json",
          "label": "Source identity and six-run coverage comparison"
        },
        {
          "href": "assets/colmap-live-verification.json",
          "label": "Actual pipeline failure, artifact access and native erasure checks"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 08."
        },
        {
          "date": "2026-09-30T02:04:11-03:00",
          "text": "Begin exact COLMAP/PyCOLMAP license and six-photo processing evaluation. No denser capture or fallback reconstruction will be counted as this route."
        },
        {
          "date": "2026-09-30T02:40:22-03:00",
          "text": "Complete retained native experiment milestone with technical checks passing and reconstruction requirements failed. Keep COLMAP available as a runnable candidate and preserve all failure evidence; professional route selection remains pending."
        }
      ]
    },
    {
      "id": "09a",
      "title": "Meshroom / AliceVision processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Run the same input through the actual photogrammetry pipeline. Retain actual processing success or failure; the full candidate journey remains in task 09.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "blocked",
      "changes": [
        "Verified current official releases: Meshroom 2025.1.0 and AliceVision 3.3.0. Both core projects are MPL-2.0, with separate third-party notices. Official Linux build configuration uses CUDA 12.1.1; separate NVIDIA agreement acceptance is pending.",
        "Prepared exact private source checkouts Meshroom 2025.1.0 at 024b6f398c67bec4968a29a2c5744e49e2bab9b8 and AliceVision 3.3.0 at 928bac2689461ffb6f0174609f983a16bdbd2b30. Pinned a separate Python 3.12.14 / PySide6 6.8.3 CLI environment; no native CUDA distribution acquired.",
        "Registered and serialized the real eleven-node photogrammetry graph. Configured classical SIFT and exhaustive pairing so no vocabulary tree or learned segmentation/matching model is needed. This is preparation only, not processing or geometry evidence."
      ],
      "limitations": [
        "AliceVision runtime download and execution are awaiting the user’s CUDA 12.1.1 agreement acceptance. Open-source CLI preparation proceeds independently.",
        "The required CUDA 12.1.1 acceptance answer has not arrived. Source/CLI preparation is verified, but the native archive has neither been downloaded nor executed. This route is blocked, not completed or demonstrated successfully."
      ],
      "verification": [
        {
          "command": "Official release and tagged build configuration inspection",
          "result": "Meshroom latest release links a 14.3 GB bundle on Zenodo; AliceVision offers a separate 1.505 GB Linux archive with published SHA-256 f43f498312859af627f2f7f65a6d33c2a3411b37989b8b680c04c8c690dcb640. Preparing pinned Meshroom source plus the smaller native distribution avoids unrelated optional AI assets."
        },
        {
          "command": "python scripts/native-demos/setup-meshroom.py",
          "result": "Passed: exact source hashes, pinned package installation, CLI help containing photogrammetry templates and kernel network namespace availability. The native acquisition flag refuses download without explicit CUDA agreement acceptance."
        },
        {
          "command": "Meshroom graph API inspection",
          "result": "Initial inspection used a nonexistent nodesDesc attribute and failed. Corrected to the current registered Graph API; scripts/native-demos/inspect-meshroom.py serialized eleven actual nodes and thirteen dependency edges without native execution."
        },
        {
          "command": "Private Meshroom Python provenance inspection",
          "result": "Retained primary PyPI package metadata, versioned wheel hashes and installed license/notices for thirteen dependencies. Qt/PySide uses its free LGPL option; native CUDA terms remain separate and pending."
        },
        {
          "command": "Native acquisition without acceptance negative check",
          "result": "Executed setup-meshroom.py --acquire-native without the acceptance flag. It exited before source/setup/download actions; the AliceVision native archive does not exist."
        },
        {
          "command": "Browser HTML log selector and SVG rendering",
          "result": "Task 09a shows blocked, exact license requirement and pending native processing. Inline graph loaded at 1100 by 1075 pixels; its retained SVG opened and rendered successfully. Clicking its linked image navigated to the SVG, so a subsequent image-selector query found no HTML image until returning to the log; this was navigation, not an asset-loading failure."
        },
        {
          "command": "Portable evidence link check",
          "result": "All 69 retained relative pictures and output links returned HTTP 200. The prepared graph and package provenance load locally."
        }
      ],
      "pictures": [
        {
          "src": "assets/meshroom-prepared-graph.svg",
          "caption": "2026-09-30: diagram derived from actual registered Meshroom and AliceVision node dependencies. Every stage remains unexecuted; this picture does not show a reconstructed head or processing success.",
          "date": "2026-09-30T03:00:08-03:00"
        },
        {
          "src": "assets/meshroom-prepared-graph-browser.png",
          "caption": "2026-09-30: actual in-app browser rendering of the prepared graph. Native runtime agreement is pending; there are no processing results or geometry.",
          "date": "2026-09-30T03:03:29-03:00"
        }
      ],
      "commits": [
        "2d8dfce1e83385bb0a01cd527f0d4a90fc5ca851"
      ],
      "outputs": [
        {
          "href": "assets/meshroom-setup-provenance.json",
          "label": "Pinned project source and pending native runtime provenance"
        },
        {
          "href": "assets/meshroom-python-provenance.json",
          "label": "Separate private CLI package licenses and wheel metadata"
        },
        {
          "href": "assets/meshroom-prepared-graph.json",
          "label": "Actual unexecuted configured native graph"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 09."
        },
        {
          "date": "2026-09-30T02:43:02-03:00",
          "text": "Begin official Meshroom/AliceVision setup and exact license review. Use the same authorized six-view captures, retaining native failures without fallback."
        },
        {
          "date": "2026-09-30T03:00:08-03:00",
          "text": "Native acquisition remains gated by the pending CUDA agreement answer. No agreement inferred from FLAME acceptance or from installed NVIDIA graphics drivers."
        },
        {
          "date": "2026-09-30T03:01:40-03:00",
          "text": "Record concrete legal-runtime blocker and continue with the next independent candidate after committing the preparation milestone. All six-photo processing, persistence, styles, geometry and full journey checks remain pending for this candidate."
        }
      ]
    },
    {
      "id": "10a",
      "title": "Standalone MakeHuman processing experiment",
      "depends": [
        "06",
        "07b"
      ],
      "requirement": "Fit and export an actual MakeHuman template without Blender. Retain actual processing success or failure; the full candidate journey remains in task 10.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Standalone MakeHuman source is pinned and unmodified. Native Human.applyAllTargets applies eight explicit neutral macros and up to 24 signed head target files; native MHCLO proxy.getCoords refits 10 shared CC0 hairstyles and textured eyes. Shared coil/beard definitions generate real geometry on the fitted head. A local CPU rasterizer and embedded-texture GLB exporter run without Qt, OpenGL or Blender.",
        "The app queues real MakeHuman fitting through the same offline process group, all-six input snapshot, artifact authorization, cancellation and erasure safeguards. Candidate-specific controls and retained diagnostics are available in English and Portuguese. Three fictional cases have native fitted explorations, without automatically replacing the currently chosen workspace or selecting expected results.",
        "Added direct native deformation checks before head publication. The fitter now computes changing crown height for every target trial. Version 2 passed all three cases; version 1 failures remain retained and have no exported head."
      ],
      "limitations": [
        "Native 10a fitting is only the route prerequisite. Written/direct refinement, expected-result selection history and the full demo journey remain tasks 16, 17 and 10. Professional likeness, hair clipping and beard styling assessment remain pending.",
        "All head geometry is fitted or inferred. Facial landmarks cover three views for Alex/Maya and two for Noah; back/profile hidden surfaces retain the prior. The neck is clipped and capped at a declared artificial plane.",
        "The native hair proxy topology is unsmoothed and the procedural beard boundaries remain coarse. These are retained limitations for professional review and catalog improvement, not successful evidence of an actual haircut.",
        "Three validated native runs took 14.418 to 14.752 seconds and retained 72.7 to 74.2 MiB privately. These synthetic fixtures and 2D landmark residuals do not establish real-client reconstruction accuracy. Initial browser FPS measurements are short loading diagnostics, not sustained benchmark results.",
        "Earlier MakeHuman unversioned and version-1 explorations remain historical experiments. Version-1 Maya/Noah processing failed honestly before export; evaluate the version-2 options. Current technical fixture views do not constitute selection of the final route."
      ],
      "verification": [
        {
          "command": "MakeHuman core loader and Human initialization probe",
          "result": "Passed on private Python 3.12.14 / NumPy 2.5.3; missing compiled base.npz warning correctly falls back to the actual OBJ parser."
        },
        {
          "command": "Initial go test ./... and npm --prefix web run build",
          "result": "Passed. Build retained the existing 500 kB demo chunk warning. A later settings-gate test and final checks remain to run."
        },
        {
          "command": "Actual native output verification on three fictional clients",
          "result": "Passed 51 decoded GLBs, 18 native rendered views, finite positions/UVs, unit normals, valid indices, embedded textures, shared six-photo SHA-256 equality and absence of Blender processing. Native prediction differs from actual Human.applyAllTargets by at most 10 micrometres; actual maximum errors are retained in the linked JSON. Deliberate 20 mm corruption failed before head publication."
        },
        {
          "command": "python scripts/native-demos/verify-local.py --candidate makehuman --job-id e979cacf-a165-47b9-91f0-a4b53881ab0d",
          "result": "Passed authenticated 17 native assets, anonymous/private artifact denial, saved option and workspace reload, affirmative permission, actual no-face failure without fallback, erasure of nonfront input during native processing, process-group termination, dependent purge and permission withdrawal. Disposable fictional fixture was deleted."
        },
        {
          "command": "IAB actual validated MakeHuman option",
          "result": "All 11 hair and 5 beard native GLBs loaded with actual job URLs. Six named viewing angles synchronized both canvases. Saved coils plus clean-shaven exploration reopens after reload. Browser-started native repeat def93450-3a9a-418b-af04-ba6f29ba9541 completed in 15.292 seconds with byte-identical head GLB; previously chosen saved model remains e979cacf-a165-47b9-91f0-a4b53881ab0d."
        },
        {
          "command": "Population rerun with makehuman-metre-z-up-v2",
          "result": "Reused all three validated job IDs and options; no duplicate processing or automatic expected-result selection."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; go test -race ./...; npm --prefix web run build",
          "result": "Passed. Race run cmd/api 1.031 seconds and internal/app 4.394 seconds. Frontend build 1.63 seconds, existing 670.79 kB demo chunk warning remains."
        },
        {
          "command": "Portable HTML and assets audit",
          "result": "Passed 96 linked files or intentional localhost app links; every linked raster image decoded. IAB task selector displayed verified MakeHuman entry and all six entry images loaded after scrolling. Initial system Python audit lacked Pillow; reran successfully using the pinned native virtual environment. An evidence-picture click opened its image page as designed; returned to the log and checked remaining links without navigation."
        }
      ],
      "pictures": [
        {
          "src": "assets/makehuman-intermediate-neck.png",
          "caption": "2026-09-30 intermediate native MakeHuman CPU render: actual head and textured eyes; whole-face filtering left a jagged neck boundary, requiring a proper plane clip before delivery.",
          "date": "2026-09-30T03:31:14-03:00"
        },
        {
          "src": "assets/makehuman-validated-comparison.png",
          "caption": "2026-09-30 Validated version-2 standalone MakeHuman head and independent assets in the actual app. Coils and clean-shaven proposed; coarse stubble boundaries visible on the current reference. Synthetic inputs, inferred hidden geometry and pending styling review.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-validated-native-check.png",
          "caption": "2026-09-30 Actual retained native target-application check, landmark coverage and resource evidence. This verifies basis application, not professional likeness.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-six-fitted-renders.png",
          "caption": "2026-09-30 Six actual CPU renders of the retained fitted MakeHuman template. Native plane-clipped neck is artificial. Synthetic inputs; hidden surfaces inferred.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-retained-failure.png",
          "caption": "2026-09-30 Actual retained intermediate Maya version-1 failure. The native check rejected the crown framing mismatch before export, and no fallback head was supplied.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-save-conflict.png",
          "caption": "2026-09-30 Intermediate stale-workspace HTTP 409 during browser saving. Saved immutable option survived; reload and reopening subsequently passed.",
          "date": "2026-09-30T04:34:00-03:00"
        }
      ],
      "commits": [
        "141d003e2f49d898b40893fd41ff737716823021"
      ],
      "outputs": [
        {
          "href": "assets/makehuman-provenance.json",
          "label": "Pinned standalone MakeHuman software, core asset and dependency terms"
        },
        {
          "href": "assets/makehuman-intermediate-basis-failures.json",
          "label": "Retained actual intermediate target-validation failures and successful rejection before head export"
        },
        {
          "href": "assets/makehuman-output-verification.json",
          "label": "Actual native output, deformation and deliberate-corruption verification"
        },
        {
          "href": "assets/makehuman-live-verification.json",
          "label": "Permission, persistence, failure, cancellation and erasure checks"
        },
        {
          "href": "assets/makehuman-populated-validated-results.json",
          "label": "Validated native runs on the three shared fictional cases"
        },
        {
          "href": "assets/makehuman-validated-browser-styles.json",
          "label": "Actual browser loading and measured 16 independent native style assets"
        },
        {
          "href": "assets/makehuman-validated-browser-cameras.json",
          "label": "Six synchronized actual browser viewing angles"
        },
        {
          "href": "assets/makehuman-validated-repeat.json",
          "label": "Browser-queued version-2 repeat and actual head checksum"
        },
        {
          "href": "assets/makehuman-populated-native-results.json",
          "label": "Historical first processing runs, before direct basis validation"
        },
        {
          "href": "assets/makehuman-browser-repeat-check.json",
          "label": "Historical initial browser-queued native repeat"
        },
        {
          "href": "assets/makehuman-browser-style-checks.json",
          "label": "Historical initial native style loading checks"
        },
        {
          "href": "assets/makehuman-browser-camera-checks.json",
          "label": "Historical initial camera and zoom checks"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 10."
        },
        {
          "date": "2026-09-30T03:04:13-03:00",
          "text": "Begin standalone MakeHuman fitting investigation while Meshroom awaits required runtime-license acceptance. Use actual MakeHuman source and core assets; do not count Blender processing as standalone MakeHuman."
        },
        {
          "date": "2026-09-30T03:22:42-03:00",
          "text": "Official MakeHuman v1.3.0 source pinned at 1f508f6083b2f823dab15de924b3bde72e08d77c. Its actual headless files3d loader and Human object instantiate a 19,158-vertex mesh using existing CC0 assets. First applyAllTargets call failed because the upstream progress callback expects a GUI application; adding a headless progress adapter is under evaluation. No Blender process or private fictional morph ground truth was used."
        },
        {
          "date": "2026-09-30T03:31:14-03:00",
          "text": "Native target application required only a headless progress callback, not a GUI replacement. Actual Human.applyAllTargets and proxy.getCoords passed with eight neutral macro targets and real hair/eye meshes. Initial CPU render showed a jagged neck extraction boundary; this intermediate defect is being corrected before verification. Setup initially looked for license files inside makehuman/; upstream keeps the two full licenses at the repository root, so the lookup was corrected and setup passed."
        },
        {
          "date": "2026-09-30T03:40:53-03:00",
          "text": "Three genuine MakeHuman runs completed in 11.20 to 11.45 seconds, with 40 to 60 paired landmarks and 72.6 to 74.1 MiB of retained private files. Rerunning population reused the same jobs/options. First population attempt ran before the rebuilt API was listening and failed with ConnectionRefusedError; after readiness it passed. /healthz served the SPA, so the actual /health endpoint was then checked and returned status ok."
        },
        {
          "date": "2026-09-30T06:51:45.261508+00:00",
          "text": "Pause before verification: comparison of native MakeHuman units exposed an MPFB basis error. Original MPFB target offsets are decimetres with Y up; its earlier fitting basis omitted conversion to metres with Z up. Repair and direct native target-application verification are active in task 07b. Actual MakeHuman fitting uses the correct conversion; its final verification and commit remain pending."
        },
        {
          "date": "2026-09-30T04:12:06-03:00",
          "text": "Resume standalone MakeHuman final verification after the committed MPFB coordinate repair. Add the same direct native target-application check to the standalone route and retain versioned outputs before its milestone commit."
        },
        {
          "date": "2026-09-30T04:17:57-03:00",
          "text": "Adding direct native deformation checks exposed a 3.2168 mm global framing mismatch for Maya and 2.2518 mm for Noah. The actual highest crown vertex changes after head morphing; a fixed neutral crown correspondence did not reproduce actual recentering. Both version-1 experiments failed before head export and remain retained. Version 2 now evaluates the highest native vertex from the full target height basis at every optimizer trial, with a separate checkpoint and new runs."
        },
        {
          "date": "2026-09-30T04:34:00-03:00",
          "text": "Intermediate save encountered expected HTTP 409 after CLI verification had changed the workspace version. The immutable explored option was retained; browser reload and reopening passed. Initial direct verifier accidentally wrote its result to the earlier MPFB filename; that historical MPFB evidence was restored from its committed version and the shared script now uses candidate-specific output names."
        }
      ]
    },
    {
      "id": "11a",
      "title": "FLAME 2023 Open processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Fit exact commercially usable Open model with compatible fitting code and assets. Retain actual processing success or failure; the full candidate journey remains in task 11.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Exact accepted Open model loaded with a restricted numeric pickle reader: 5,023 vertices, 9,976 triangles, 300 identity components and 100 Open expression components. An original NumPy implementation evaluates neutral-pose identity fitting and renders six real template views locally. Official linked PyTorch repository downloaded at its pinned commit for inspection; its file headers and SMPL-X dependency differ from the root MIT notice, so that implementation and dependencies are not executed or used by this route.",
        "App now queues exact Open head fitting with six retained authorized inputs, native status and allowlisted shape/style/attribution diagnostics. An approximate 64 by 32 radial cage adapts the same 11 hairstyle and five beardstyle GLBs independently, preserving their real topology and textures. Open attribution, citation, change notices and license links are visible in the candidate workflow and embedded in GLBs.",
        "Final version-4 FLAME uses a declared canonical face-plane alignment, bounded/smoothed scalp attachment and the shared deterministic beard definitions sampled directly on actual fitted native skin. Versioned historical runs remain available with visible known-limitation notices. All three validated cases have actual 17-asset outputs and saved options, without automatic expected-result selection."
      ],
      "limitations": [
        "This processing arm fits the first 20 identity components with all expression and rig parameters neutral. Remaining identity components and texture likeness are not evidence of success; coverage, clipping and likeness must be evaluated from the retained actual outputs.",
        "This native milestone is a prerequisite to full candidate demo task 11. Written and direct editing, chosen expected-result history, broader catalog refinement and full integrated journeys remain pending. Professional likeness, clipping and style acceptance are pending.",
        "All geometry is fitted/inferred, with no measured 3D surface claim. Face detections paired three views for Alex/Maya and two for Noah; back and profiles lack paired face landmarks. First 20/300 identity components fit, all 100 expressions and five rig poses are neutral. No FLAME texture space or client texture likeness supplied.",
        "Hairstyle cage is approximate: 1,796 to 1,896 of 2,048 rays had usable intersections; 139 to 239 rays required a 25 mm limit before smoothing. Long hair below the Open model neck remains original free geometry and has no torso underneath. Beard boundaries remain coarse for task 15 refinement; the observed spikes were corrected.",
        "Version-4 native runs took 23.329 to 23.450 seconds and retained 98.7 to 100.5 MiB privately, with 161 optimizer evaluations each. Camera calibration is assumed, not recovered. Initial browser FPS and load timing are short diagnostic measurements, not a sustained benchmark."
      ],
      "verification": [
        {
          "command": "Pinned setup and neutral Open model CPU render",
          "result": "Passed exact model SHA-256, restricted numeric loader, all 5,023 template vertices and 9,976 triangles, finite identity tensors and neutral-rig weight sums. Six actual neutral renders retained privately."
        },
        {
          "command": "go test ./... and npm --prefix web run build",
          "result": "Passed internal/app 0.740 seconds; build 1.64 seconds with existing 672.06 kB demo chunk warning. Native processing verification remains in progress."
        },
        {
          "command": "python scripts/native-demos/verify-flame-assets.py",
          "result": "Passed 51 actual GLBs with finite positions, valid indices, normals, textures and full embedded Open model attribution/change notices; 18 actual fitted renders; same six-photo SHA-256 snapshots as MPFB; exact 5,023-vertex Open identity evaluation; all direct native-basis errors below 10 micrometres. Injected 20 mm corruption was rejected before head publication."
        },
        {
          "command": "python scripts/native-demos/verify-local.py --candidate flame --job-id 7b5ffea9-ba32-4b1c-8f37-4e6a0d1d4c80",
          "result": "Passed all 17 authenticated native outputs, anonymous/unlisted artifact denial, saved option/workspace reload, permission gate, actual no-face failure with no head, nonfront erasure during real native processing, killed process group, dependent purge, no recreation, and withdrawal. Disposable diagnostic fixture deleted."
        },
        {
          "command": "IAB actual candidate flow, v4",
          "result": "All 11 hairstyle and five beardstyle exports loaded at actual v4 native URLs. Six named cameras synchronized both views, keyboard zoom synchronized, saved coils plus clean-shaven option and workspace reloaded with the same head/style URLs and profile angle. Browser-queued repeat 42081481-092d-4da4-8412-45f6f9a5952c completed in 23.559 seconds with byte-identical head GLB. No newest-run auto-selection."
        },
        {
          "command": "Population rerun with flame-2023-open-neutral-rig-v4",
          "result": "Reused all three validated jobs and options; did not regenerate or change expected-result selection."
        },
        {
          "command": "go test ./...; go test -race ./...; npm --prefix web run build",
          "result": "Passed. Latest race internal/app 4.346 seconds. Frontend build passed with the retained demo chunk warning; final text-only warning update is rebuilding."
        },
        {
          "command": "Final frontend build and portable evidence log",
          "result": "Passed final npm build in 1.51 seconds. 117 linked outputs/pictures or intentional local app links pass file/HTTP checks; all raster images decode. IAB task selector and all nine FLAME intermediate/final pictures loaded successfully."
        }
      ],
      "pictures": [
        {
          "src": "assets/flame-first-aligned-comparison.png",
          "caption": "2026-09-30 actual intermediate FLAME version-2 comparison: beard cage produced visible stretched strands above the ears. Native geometry and persistence checks alone did not catch this visual defect.",
          "date": "2026-09-30T05:01:43-03:00"
        },
        {
          "src": "assets/flame-intermediate-cage-clipping.png",
          "caption": "2026-09-30 isolated clean-shaven comparison removed the stretched beard strands, locating the defect in beard attachment rather than native head or hair fitting.",
          "date": "2026-09-30T05:01:43-03:00"
        },
        {
          "src": "assets/flame-style-bob02.png",
          "caption": "2026-09-30 intermediate version-3 bob hairstyle: residual radial cage spikes above the ears require corrected attachment, despite successful actual GLB loading.",
          "date": "2026-09-30T05:07:13-03:00"
        },
        {
          "src": "assets/flame-style-long01.png",
          "caption": "2026-09-30 intermediate version-3 long hairstyle: unbounded cage deformation and original long cards below the head are visible; retained as failure evidence.",
          "date": "2026-09-30T05:07:13-03:00"
        },
        {
          "src": "assets/flame-final-style-bob02.png",
          "caption": "2026-09-30 Corrected bounded/smoothed bob attachment on actual FLAME fitted head; no observed spikes. Synthetic input, inferred geometry, professional assessment pending.",
          "date": "2026-09-30T05:15:59-03:00"
        },
        {
          "src": "assets/flame-final-style-long01.png",
          "caption": "2026-09-30 Corrected long hairstyle attachment. Original long free cards extend below the FLAME neck; absence of a torso is a retained display limitation.",
          "date": "2026-09-30T05:15:59-03:00"
        },
        {
          "src": "assets/flame-final-reopened-profile.png",
          "caption": "2026-09-30 Actual saved coils and clean-shaven exploration reopened with the same fitted native head and synchronized profile cameras. Not a selected client expected result.",
          "date": "2026-09-30T05:15:59-03:00"
        },
        {
          "src": "assets/flame-final-native-evidence.png",
          "caption": "2026-09-30 Actual retained exact Open model basis check, missing-view coverage and processing evidence. Native coefficient evaluation is not a likeness assessment.",
          "date": "2026-09-30T05:15:59-03:00"
        },
        {
          "src": "assets/flame-six-fitted-renders.png",
          "caption": "2026-09-30 Six actual fitted Open model CPU renders, attributed to Max Planck and Li, Bolkart, Black, Li and Romero (2017), DOI 10.1145/3130800.3130813. CC-BY-4.0 plus published model terms; fitting, frame/material changes and inferred surfaces explicitly declared.",
          "date": "2026-09-30T05:15:59-03:00"
        }
      ],
      "commits": [
        "9f3c7df392e6a4bf505a1273a7ec252f576eeefc"
      ],
      "outputs": [
        {
          "href": "assets/flame-native-provenance.json",
          "label": "Separate exact model, original processing code, inspected reference repository and shared asset terms"
        },
        {
          "href": "assets/flame-initial-origin-results.json",
          "label": "Retained initial coordinate-frame experiment and larger actual 2D residuals"
        },
        {
          "href": "assets/flame-populated-native-results.json",
          "label": "Aligned native Open model runs on the three fictional shared cases"
        },
        {
          "href": "assets/flame-intermediate-cage-results.json",
          "label": "Retained version-2 head fitting with defective radial beard adaptation"
        },
        {
          "href": "assets/flame-intermediate-unbounded-hair-results.json",
          "label": "Version-3 native runs with remaining unbounded hairstyle attachment defects"
        },
        {
          "href": "assets/flame-output-verification.json",
          "label": "Actual Open outputs, attribution, source hashes and corruption rejection"
        },
        {
          "href": "assets/flame-live-verification.json",
          "label": "Actual local permission, failure, cancellation, persistence and erasure checks"
        },
        {
          "href": "assets/flame-browser-style-checks.json",
          "label": "All 16 actual final native styles loaded in IAB"
        },
        {
          "href": "assets/flame-browser-camera-checks.json",
          "label": "Six synchronized named angles and shared zoom measurements"
        },
        {
          "href": "assets/flame-browser-repeat-check.json",
          "label": "Real browser-queued repeat and retained head checksum"
        },
        {
          "href": "assets/flame-intermediate-browser-styles.json",
          "label": "Historical version-3 actual load checks before visual hair corrections"
        },
        {
          "href": "assets/flame-intermediate-selection-check.json",
          "label": "Retained intermediate browser selection mismatch and fictional fixture title correction"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 11."
        },
        {
          "date": "2026-09-30T04:35:51-03:00",
          "text": "Begin exact FLAME 2023 Open native fitting with the downloaded, explicitly accepted model. Keep its model terms separate from software and shared style licenses, and keep all model weights private."
        },
        {
          "date": "2026-09-30T04:45:27-03:00",
          "text": "Initial neutral CPU render passed. No academic model, FLAME texture space, RingNet embedding or separately trained fitting shortcut acquired. Prior guessed GitHub repository URLs returned 404; followed the actual official project link and pinned the correct upstream source."
        },
        {
          "date": "2026-09-30T04:55:25-03:00",
          "text": "First three neutral-origin runs completed in 23.160 to 23.383 seconds, with 11.64 to 20.28 pixel mean landmark errors. Inspection found neutral FLAME eyeball plane canonical Y about -0.024 m, versus shared neutral mannequin -0.128 m. Declared fixed -0.10 m canonical Y alignment and cage center -0.065 m, without reading any client morph ground truth. Version 2 reruns now complete in 23.275 to 23.363 seconds, with 3.03 to 3.52 pixel errors. Both settings arms and outputs remain retained; this does not verify likeness."
        },
        {
          "date": "2026-09-30T05:01:43-03:00",
          "text": "Actual browser inspection found that a passing GLB decode and native-basis check did not imply good style attachment: radial beard warping stretched individual strand vertices into visible spikes. Isolating clean-shaven current/proposed views removed the spikes. Version-2 outputs and screenshot are retained as defective style-adaptation evidence. Version 3 preserves native FLAME head fitting and hair cage, but resamples the same shared procedural beard definitions directly on fitted FLAME skin using detected neutral-front lip correspondences. No mannequin head is substituted."
        },
        {
          "date": "2026-09-30T05:07:13-03:00",
          "text": "All 16 version-3 native assets loaded, but broader visual inspection found spikes in some bob and long hairstyle cards. The unbounded radial field crossed mouth/neck topology with displacements above 20 cm. Version 4 bounds attachment to 25 mm, smooths its cage twice, and fades deformation below scalp and on long free ends. Shared topology/materials remain real; the same native fitted head and resampled beard definitions remain in use. Version-3 evidence is retained and is not final compatibility proof."
        },
        {
          "date": "2026-09-30T05:15:59-03:00",
          "text": "An intermediate rapid browser sequence saved a full beard while its typed option title said clean-shaven. Fresh DOM inspection, repeat clean-shaven selection, save and reload passed; no source state-loss bug reproduced. Corrected only the misleading local fictional fixture title using local SQLite, preserving its actual state, and retained a separate verified clean-shaven option. This fixture correction is not credited as a delivered renaming/history workflow."
        },
        {
          "date": "2026-09-30T05:18:14-03:00",
          "text": "Verified native prerequisite 11a. Current fictional Alex workspace retains the tested version-4 FLAME profile exploration to show reopening; this is a reversible technical fixture view, not professional approval or selection of the final route. Full demo task 11 remains pending."
        }
      ]
    },
    {
      "id": "12a",
      "title": "Open3D component processing experiment",
      "depends": [
        "07b",
        "10a",
        "11a"
      ],
      "requirement": "Process and evaluate meshes using Open3D with named reconstruction/fitting dependency. Retain actual processing success or failure; the full candidate journey remains in task 12.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Installed official Open3D CPU-only 0.20.0 wheel (SHA-256 cee9c7686a794de792070f029f8b81913aff1269154ee43de9cc4af72fa5e087). Pinned 76 runtime packages and retained separate package notices, primary sources and hashes. No CUDA or learned reconstruction model acquired.",
        "Added explicit upstream native-run dependencies, six-photo snapshot matching, source ownership checks and durable transitive experiment-output erasure. Full product refinement/history remain pending common tasks.",
        "Preserved coincident normal seams after the v1 visual regression; v2 CPU renders show a smooth neck cap. v3 records actual native Tensor ICP iterations; v4 adds full upstream provenance to PLY downloads. Final v5 uses short ordered provenance comments compatible with bounded native PLY readers.",
        "v5 regenerates all nine populated component cases, retains full license metadata in short PLY comments, and exposes only verified-version PLY downloads. Native reader successfully reopens all 27 exported PLY files. Earlier failures and versioned experiments remain available and labeled.",
        "Final browser-started v5 run d91d80a1-fd88-4f31-8ad6-43fe9975986d uses MakeHuman e979cacf-a165-47b9-91f0-a4b53881ab0d with triangle fraction 0.8, voxel size 0.004 m and 10000 points: 3638 ms, 132.8 MiB retained, 4 actual ICP iterations. Reversible Alex technical workspace now reopens this processed head, coils and chinstrap, front view and synchronized 1.15 m zoom. This is not an expected-result choice or final route selection."
      ],
      "limitations": [
        "Only native supporting processing milestone 12a is verified. Full candidate 12 refinement, direct 3D editing, expected selection and revision history remain pending tasks 16 and 17. No independent scan or real-client likeness established. Historical v1 shading failure and v4 native-reader failure remain retained; old unverified PLY links are hidden with an explanatory notice."
      ],
      "verification": [
        {
          "command": "Private Python setup-open3d.py",
          "result": "CPU-only build confirmed; official wheel and MIT notice verified; 76 separate software records retained."
        },
        {
          "command": "Intermediate internal/app test compile",
          "result": "Two test-fixture editing errors found before execution (fixture organization field and insertion position); corrected before behavioral checks. No native success inferred from fixture tests."
        },
        {
          "command": "First native Open3D population",
          "result": "All three real jobs failed at import because the wrapper filename shadowed the installed open3d package. No head published. Renamed the wrapper process-open3d.py; failed jobs and diagnostics are retained and new attempts use a separate checkpoint."
        },
        {
          "command": "populate-components.py open3d --upstream makehuman/blender-mpfb/flame --attempt import-fixed",
          "result": "All nine real native runs completed. Each uses one retained upstream fitted head, its same six original photo dependencies and the same 16 independent style GLBs. MakeHuman default processing measured maximum upstream-to-processed deviation 0.349 to 0.409 mm; these are model deviations, not likeness measurements."
        },
        {
          "command": "Intermediate live verification",
          "result": "Actual 19 artifacts, auth denial and state reopening passed. Fixture permission response field used url instead of path; corrected against current API source. Disposable client was removed by finally; no positive processing result inferred from this failed verifier."
        },
        {
          "command": "Intermediate native privacy verifier",
          "result": "Real upstream fitting, completed dependent processing, live child processing and parent removal passed. Final photo-count assertion failed because the retained snapshot also included two optional detail assignments. Verifier now copies exactly the six required photos. Failed disposable fixture was fully deleted in finally."
        },
        {
          "command": "Intermediate visual review after native metrics passed",
          "result": "Open3D v1 coincident-vertex merging joined the intentionally separate neck-cap normal seam. Actual browser and CPU renders showed a jagged shading band. Small geometric deviation did not detect this visual regression. Preserved failure renders/results; v2 keeps seam vertices separate before decimation."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/native-demos/verify-components-assets.py (v4)",
          "result": "FAILED with RPly Line too long and SIGABRT, before claiming PLY compatibility. coredumpctl identified ReadPointCloudFromPLY in libOpen3D and libc fortify; memory available and no OOM event. Native data and app remained intact. Original retained v4 exports are historical evidence; regenerating v5."
        },
        {
          "command": "python scripts/native-demos/verify-components.py after download-check edit",
          "result": "Initial verification script did not start due to an unmatched closing parenthesis; corrected. No app mutation occurred."
        },
        {
          "command": "setup-open3d.py",
          "result": "76 pinned package license records retained, including bundled Roboto and Jupyter third-party notices. CPU-only wheel unchanged."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS, internal/app 0.875 s, including bounded component settings, source ownership, same-six snapshots, recursive output cancellation, tombstones and export symlink containment."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS 5.262 s."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS 1.58 s. Existing large demo chunk warning remains; browser performance is measured separately."
        },
        {
          "command": "python scripts/native-demos/verify-components.py",
          "result": "PASS final v5: 22 actual artifacts, real upstream fit and component processing, corrupt upstream failure with no fallback, independent ownership, save/reopen, removal of parent plus completed/failed/live children, no re-created folders, source photos and permission preserved until explicit withdrawal."
        },
        {
          "command": "@Browser final v5 native processing and asset inspection",
          "result": "PASS all 48 independent style selections across three upstream routes; six synchronized angles; keyboard zoom updates both canvases and persists at 1.15 m after reload. Range-fill automation did not change the controlled slider, so the behavioral check used normal keyboard interaction. Saved option contains coils plus chinstrap; no browser console errors."
        },
        {
          "command": "@Browser PLY download + actual Open3D native reader",
          "result": "PASS 7694 triangles and complete chunked provenance on the browser-downloaded file."
        },
        {
          "command": "populate-components.py open3d --upstream makehuman --attempt final-ply-comments (repeat)",
          "result": "PASS reused existing three job and option IDs; no new processing or options."
        },
        {
          "command": "Portable HTML log asset audit",
          "result": "PASS 147 retained references, every PNG decode and SVG parse; task selector renders the verified milestone and pending full candidate journey."
        }
      ],
      "pictures": [
        {
          "src": "assets/open3d-three-upstream-comparison-v1.png",
          "caption": "2026-09-30 / intermediate v1 failure: MakeHuman neck-cap shading worsened after vertex welding despite small mesh deviation. Same CPU renderer.",
          "date": "2026-09-30T06:03:37-03:00"
        },
        {
          "src": "assets/open3d-makehuman-coils-chinstrap.png",
          "caption": "2026-09-30 / intermediate v1 browser: real independent style loading passed, but processed neck shading remains visibly jagged and is not accepted as final.",
          "date": "2026-09-30T06:03:37-03:00"
        },
        {
          "src": "assets/open3d-three-upstream-comparison.png",
          "caption": "2026-09-30: final v5 processing of MPFB, standalone MakeHuman and FLAME fitted heads, same synthetic six-photo inputs. Upstream above, Open3D below. Corrected neck normals; no observed scan or real likeness claim.",
          "date": "2026-09-30T06:27:14-03:00"
        },
        {
          "src": "assets/open3d-browser-settings-final.png",
          "caption": "2026-09-30: explicit MakeHuman upstream and editable Open3D settings before starting real local processing.",
          "date": "2026-09-30T06:33:17-03:00"
        },
        {
          "src": "assets/open3d-browser-native-result-final.png",
          "caption": "2026-09-30: completed browser-started native processing with live retained outputs, actual geometry measurements and iterations.",
          "date": "2026-09-30T06:33:17-03:00"
        },
        {
          "src": "assets/open3d-browser-current-proposed-final.png",
          "caption": "2026-09-30: synchronized current and proposed independent style assets on the corrected Open3D result. Synthetic client, inferred fitted geometry and coarse beard borders remain explicit; professional acceptance pending.",
          "date": "2026-09-30T06:33:17-03:00"
        }
      ],
      "commits": [
        "5d5c0f9"
      ],
      "outputs": [
        {
          "href": "assets/open3d-provenance.json",
          "label": "Exact CPU release and separate software/model/asset provenance"
        },
        {
          "href": "assets/open3d-initial-import-failures.json",
          "label": "Actual first processing failures with no native model"
        },
        {
          "href": "assets/open3d-makehuman-populated-results.json",
          "label": "Three actual MakeHuman-dependent Open3D results"
        },
        {
          "href": "assets/open3d-blender-mpfb-populated-results.json",
          "label": "Three actual corrected MPFB-dependent Open3D results"
        },
        {
          "href": "assets/open3d-flame-populated-results.json",
          "label": "Three actual exact Open FLAME-dependent Open3D results"
        },
        {
          "href": "assets/open3d-output-verification-v1.json",
          "label": "Intermediate numerical checks that missed the shading regression"
        },
        {
          "href": "assets/open3d-cached-setup-resources.json",
          "label": "Measured cached setup repeat, distinct from initial installation"
        },
        {
          "href": "assets/open3d-live-verification.json",
          "label": "Final native flow and transitive privacy evidence"
        },
        {
          "href": "assets/open3d-output-verification.json",
          "label": "Final GLB, render, PLY, ICP and provenance checks"
        },
        {
          "href": "assets/open3d-browser-style-checks.json",
          "label": "48 final browser asset loads and measured render metrics"
        },
        {
          "href": "assets/open3d-browser-camera-checks.json",
          "label": "Six actual synchronized camera states"
        },
        {
          "href": "assets/open3d-browser-download-verification.json",
          "label": "Actual browser PLY download reopened by native reader"
        },
        {
          "href": "assets/open3d-browser-reopen-verification.json",
          "label": "Native meshes, option and zoom retained across reload"
        },
        {
          "href": "assets/open3d-blender-mpfb-populated-results-v1.json",
          "label": "Historical processing iteration: open3d-blender-mpfb-populated-results-v1"
        },
        {
          "href": "assets/open3d-blender-mpfb-populated-results-v2.json",
          "label": "Historical processing iteration: open3d-blender-mpfb-populated-results-v2"
        },
        {
          "href": "assets/open3d-blender-mpfb-populated-results-v3.json",
          "label": "Historical processing iteration: open3d-blender-mpfb-populated-results-v3"
        },
        {
          "href": "assets/open3d-blender-mpfb-populated-results-v4.json",
          "label": "Historical processing iteration: open3d-blender-mpfb-populated-results-v4"
        },
        {
          "href": "assets/open3d-flame-populated-results-v1.json",
          "label": "Historical processing iteration: open3d-flame-populated-results-v1"
        },
        {
          "href": "assets/open3d-flame-populated-results-v2.json",
          "label": "Historical processing iteration: open3d-flame-populated-results-v2"
        },
        {
          "href": "assets/open3d-flame-populated-results-v4.json",
          "label": "Historical processing iteration: open3d-flame-populated-results-v4"
        },
        {
          "href": "assets/open3d-makehuman-populated-results-v1.json",
          "label": "Historical processing iteration: open3d-makehuman-populated-results-v1"
        },
        {
          "href": "assets/open3d-makehuman-populated-results-v2.json",
          "label": "Historical processing iteration: open3d-makehuman-populated-results-v2"
        },
        {
          "href": "assets/open3d-makehuman-populated-results-v3.json",
          "label": "Historical processing iteration: open3d-makehuman-populated-results-v3"
        },
        {
          "href": "assets/open3d-makehuman-populated-results-v4.json",
          "label": "Historical processing iteration: open3d-makehuman-populated-results-v4"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 12."
        },
        {
          "date": "2026-09-30T05:19:19-03:00",
          "text": "Begin Open3D supporting-component workflow on retained fitted heads, with explicitly named upstream native run and its same six authorized photo dependencies. This component is not a raw-photo head reconstructor. Preserve parent-output deletion/cancellation boundaries before processing copied meshes."
        },
        {
          "date": "2026-09-30T05:42:56-03:00",
          "text": "Open3D processing workflow implemented; native local processing and browser verification are in progress."
        },
        {
          "date": "2026-09-30T05:45:41-03:00",
          "text": "Corrected Open3D import-shadowing failure; starting separate retained experiments."
        },
        {
          "date": "2026-09-30T05:52:24-03:00",
          "text": "All three fitted upstream routes processed successfully. Native privacy verification and browser asset checks continue."
        },
        {
          "date": "2026-09-30T05:54:31-03:00",
          "text": "Native outputs across all upstream routes retained. Final fixture verification now isolates the required six-photo arm and includes actual corrupt-upstream failure."
        },
        {
          "date": "2026-09-30T06:03:37-03:00",
          "text": "Preserve intentional normal seams in Open3D v2; all final native and visual checks must use the corrected version."
        },
        {
          "date": "2026-09-30T06:33:17-03:00",
          "text": "Corrected the supporting milestone dependencies to the three actual validated upstream fitting routes used. Failed COLMAP is retained as an independently evaluated candidate, not a mandatory source for this processor."
        }
      ]
    },
    {
      "id": "13a",
      "title": "MeshLab / PyMeshLab component processing experiment",
      "depends": [
        "07b",
        "10a",
        "11a"
      ],
      "requirement": "Clean, repair, simplify and export shared meshes with named upstream route. Retain actual processing success or failure; the full candidate journey remains in task 13.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Acquired official PyMeshLab 2025.7.post1 cp312 Linux wheel (SHA-256 bc453d89b114671affc747991a939b257d2320b71885b31213190c64081f5c35), running MeshLab 2025.07d. Retained pinned PyMeshLab, MeshLab, VCGlib and pybind11 primary license notices separately; all model/style rights remain upstream dependencies. Native cleanup/repair/decimation/measurement/PLY filters load without a desktop service.",
        "Added the identified upstream component route to the same cancellable, private six-input processing pipeline. Actual filters preserve boundary/topology/normals, split non-manifold edges without deleting faces, record bidirectional sampled vertex distances and reopen native PLY exports. No hole filling, native photo reconstruction or fallback head is claimed.",
        "All nine fitted inputs are already two-manifold at the edge level. Cleanup/edge repair therefore does not invent an improvement; native before/after topology remains visible. A declared artificial edge fixture separately verifies duplicate/null face cleanup and edge splitting, preserving all nondegenerate triangle coordinates.",
        "All 48 native hairstyle/beard selections across the three upstreams load in the browser. Hair-only, beard-only, clean-shaven and keep-current resolve independently. Browser-started run 517c219f-56f4-48de-a3e0-42c17c44d245 uses MakeHuman e979cacf-a165-47b9-91f0-a4b53881ab0d, triangle fraction 0.85 and 3000 distance samples per direction; native output has 8174 triangles. Actual PLY download reopens in PyMeshLab with complete provenance. Saved long-hair/moustache exploration, synchronized left three-quarter angle and 1.20 m zoom survive reload. This is a reversible technical fixture, not a client expected-result or final route selection."
      ],
      "limitations": [
        "Default six-stage processing takes 2.805 to 3.485 seconds for these nine fitted cases and retains 115.0 to 181.8 MiB privately. Native vertex-to-surface maxima are 0.2246 to 0.4705 mm; these are not real-client errors. Point sampling may miss unmeasured surface regions. Full refinement, expected selection and professional acceptance remain pending.",
        "Only native milestone 13a is verified. Full candidate 13 written refinements, direct editing, expected-result selection and revision history remain pending 16 and 17. Professional acceptance and final choice remain pending. No measured scan, real-client likeness, successful six-photo MeshLab reconstruction or repaired hidden coverage is claimed."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS internal/app 0.794 s, including MeshLab as a transitive dependent route in the security fixture."
        },
        {
          "command": "verify-components-assets.py --candidate meshlab (first run)",
          "result": "Verification-script assertion expected seven filter stages although the actual planned workflow has six. Corrected to require the actual cleanup, repair and decimation filter identities plus measured conversion outcomes. Native outputs were already completed; the separate injected non-manifold repair fixture passed before this assertion."
        },
        {
          "command": "python scripts/native-demos/verify-components.py --candidate meshlab",
          "result": "PASS 20 actual artifacts, real upstream fit and MeshLab native child, corrupt upstream failure without fallback, private/anonymous/cross-client denial, persistent state, running child killed during upstream removal, transitive purging and no recreation. Source photos and permission remain until withdrawal."
        },
        {
          "command": "verify-components-assets.py --candidate meshlab",
          "result": "PASS 153 actual GLBs, 54 renders and nine native PLY writer/reader conversions. All source six-photo hashes match the named upstream, style bytes are unchanged, embedded FLAME license provenance survives when applicable, native filter identities and sampled distance counts are real."
        },
        {
          "command": "@Browser native workflow",
          "result": "PASS editable settings, actual running/completed job, 48 measured GLB style loads, six synchronized angles, keyboard zoom, actual converted PLY download, independent keep-current/hair-only/beard-only/clean-shaven choices and saved native state across reload. No browser console errors."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; go test -race ./internal/app; npm --prefix web run build",
          "result": "PASS latest internal/app 0.901 s, race 5.462 s and build 1.65 s. Existing large demo chunk warning retained."
        },
        {
          "command": "verify-components-assets.py (Open3D regression after generalizing verifier)",
          "result": "PASS original nine Open3D outputs, 153 GLBs, 54 renders, 27 native PLY files, actual ICP counts and same-input/source provenance."
        },
        {
          "command": "setup-meshlab.py cached repeat",
          "result": "PASS 0.888 wall s, 0.500 CPU s, 131576 KiB peak child RSS. Initial total acquisition time was not measured; this is explicitly a cached repeat."
        },
        {
          "command": "@Browser direct file:// log check",
          "result": "Blocked by the in-app browser URL policy, which permits only HTTP and HTTPS. No bypass attempted. Existing loopback-served log remains available; filesystem relative-link/image checks are separate from direct file-protocol browser verification."
        },
        {
          "command": "populate-components.py meshlab --upstream makehuman --attempt initial (repeat)",
          "result": "PASS reused all three native job and option IDs without regeneration or extra options."
        },
        {
          "command": "Portable evidence audit",
          "result": "PASS 164 retained relative references and PNG/SVG decodes; direct file:// browser check remains unavailable under browser protocol policy."
        }
      ],
      "pictures": [
        {
          "src": "assets/meshlab-three-upstream-comparison.png",
          "caption": "2026-09-30: actual MeshLab simplification of the MPFB, MakeHuman and FLAME fitted heads. Original above and native processed result below, using identical CPU cameras and lighting. Same synthetic six-photo inputs; no observed scan or real likeness proof.",
          "date": "2026-09-30T06:59:52-03:00"
        },
        {
          "src": "assets/meshlab-browser-settings.png",
          "caption": "2026-09-30: explicit native MakeHuman dependency and editable triangle fraction and distance-sample settings before actual MeshLab processing.",
          "date": "2026-09-30T07:07:56-03:00"
        },
        {
          "src": "assets/meshlab-browser-native-result.png",
          "caption": "2026-09-30: completed real MeshLab experiment with native measurements, filter changes and conversion evidence. Historical missing photo reconstruction remains distinct.",
          "date": "2026-09-30T07:07:56-03:00"
        },
        {
          "src": "assets/meshlab-browser-current-proposed.png",
          "caption": "2026-09-30: saved current/proposed comparison using the same real processed head with independently selected long hair and moustache. Synthetic example; coarse beard borders and long hair below the cut-off bust remain catalog limitations.",
          "date": "2026-09-30T07:07:56-03:00"
        }
      ],
      "commits": [
        "ea2d9dea41146c18b5f63b51967602eb88ac6312"
      ],
      "outputs": [
        {
          "href": "assets/meshlab-provenance.json",
          "label": "Exact software wheel, source pins, GPL/BSD notices and native library hashes"
        },
        {
          "href": "assets/meshlab-native-filter-fixture.json",
          "label": "Actual native cleanup and non-manifold edge splitting on a declared artificial topology diagnostic"
        },
        {
          "href": "assets/meshlab-makehuman-populated-results.json",
          "label": "Three real supporting workflows using standalone MakeHuman"
        },
        {
          "href": "assets/meshlab-blender-mpfb-populated-results.json",
          "label": "Three real supporting workflows using MPFB"
        },
        {
          "href": "assets/meshlab-flame-populated-results.json",
          "label": "Three real supporting workflows using accepted FLAME Open"
        },
        {
          "href": "assets/meshlab-live-verification.json",
          "label": "Actual geometry, private access, corrupted upstream and transitive live cancellation checks"
        },
        {
          "href": "assets/meshlab-output-verification.json",
          "label": "Actual native MeshLab filter, GLB, render, PLY, source and license checks"
        },
        {
          "href": "assets/meshlab-cached-setup-resources.json",
          "label": "Actual cached setup resource measurement and initial timing limitation"
        },
        {
          "href": "assets/meshlab-browser-style-checks.json",
          "label": "48 real browser style loads across three fitted upstreams"
        },
        {
          "href": "assets/meshlab-browser-camera-checks.json",
          "label": "Six synchronized actual camera states"
        },
        {
          "href": "assets/meshlab-browser-choice-checks.json",
          "label": "Independent keep-current, clean-shaven, hair-only and beard-only behavior"
        },
        {
          "href": "assets/meshlab-browser-download-verification.json",
          "label": "Actual browser native PLY download and PyMeshLab reopen"
        },
        {
          "href": "assets/meshlab-browser-reopen-verification.json",
          "label": "Native head, styles and camera preserved across browser reload"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 13."
        },
        {
          "date": "2026-09-30T06:35:44-03:00",
          "text": "Begin native MeshLab/PyMeshLab supporting processing. Read the approved candidate decision, current processing architecture and exact primary software license terms before acquisition or implementation."
        },
        {
          "date": "2026-09-30T07:07:56-03:00",
          "text": "Native audit clarified edge-repair behavior on already manifold inputs: the MeshLab splitting routine allocates temporary unused vertices even when there is no non-manifold edge. Final cleanup removes them; final topology and connected components are unchanged. The full intermediate counts remain visible rather than being hidden as a no-op. Earlier statement about unchanged repair refers to final surface topology, not every intermediate allocation."
        }
      ]
    },
    {
      "id": "14a",
      "title": "CloudCompare component processing experiment",
      "depends": [
        "07b",
        "10a",
        "11a"
      ],
      "requirement": "Align and compare shared outputs with named upstream reconstruction/fitting route. Retain actual processing success or failure; the full candidate journey remains in task 14.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Built private pinned CloudCompare 2.13.2 CPU CLI with only Core I/O, native ICP trace, binary PLY conversion, actual surface sampling/C2M/C2C distances and known-transform registration. Actual browser controls support sample count, iteration limit and overlap.",
        "Added optional native comparison reference from the same client and six immutable photos. Both source and reference are live dependencies checked at queue, publication, artifact access and saved-state validation; reference-only deletion cancels and removes dependent copies, workspaces and options.",
        "Completed native CloudCompare v2 cross-route evaluation of all three synthetic cases with MakeHuman, MPFB and FLAME upstream fits. Optional second fit uses the same immutable six photos; both live dependencies guard processing, publication, previews, options and derived-media access."
      ],
      "limitations": [
        "CloudCompare requires the explicitly named fitted upstream. The preview preserves that fit; native cross-route matrices affect diagnostic clouds only. Template agreement does not establish observed anatomy, reconstruction accuracy or client likeness.",
        "Native random surface samples and model-mesh sampling have no seed control in this pinned CLI. Retained samples/settings/scripts make the experiment reproducible, but random point positions and cross-route ICP results may vary.",
        "Common direct/written refinements, expected-result selection/history and professional style/likeness review remain pending. Existing catalog has coarse beard borders and long-hair below the cropped bust, to be refined in task 15.",
        "Native surface sampling and mesh-reference ICP use internal randomness without CLI seed control. Metrics are retained actual results, not claimed byte-deterministic samples. Catalog beard boundaries remain coarse; professional style and likeness acceptance and full editing/expected-result journeys are pending."
      ],
      "verification": [
        {
          "command": "cmake source build (4 parallel jobs)",
          "result": "Passed: 108.98 seconds wall, 403.31 seconds CPU, peak child RSS 867756 KiB. Private CloudCompare 2.13.2 with only Core I/O plugin."
        },
        {
          "command": "verify-components-assets.py --candidate cloudcompare",
          "result": "Passed actual 153 GLBs and 54 renders from nine native v2 jobs, both same-six-photo source snapshots, unchanged 16 styles per job, coordinate conversion error zero, and all 45 mesh/cloud PLY exports reopened by CloudCompare with coordinate/topology/scalar-field equality."
        },
        {
          "command": "verify-components.py --candidate cloudcompare",
          "result": "Passed actual disposable primary and reference MakeHuman fits, native CloudCompare processing, 24 owned artifacts, corrupt upstream failure/no fallback, cross-client rejection, running-child cancellation and reference-only transitive erasure. Primary fit, six source photos and permission survived reference removal; withdrawn diagnostics denied; deleted reference cannot be reused."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; mise exec go@1.26.0 -- go test -race ./internal/app; npm --prefix web run build",
          "result": "PASS: all Go packages and app race tests (5.795 s); frontend production build (1.62 s). Existing demo chunk size warning remains."
        },
        {
          "command": "@Browser: 48 real style loads across three upstreams; six named synchronized angles; independent keep-current and clean-shaven; save, reload and native download",
          "result": "PASS: actual asset URLs and measured mesh keys; retained native job ea0e181b-0061-4e1a-9a69-418197718bc4, selected hair short01, beard goatee, shared angle pi/4 and zoom 1.19 survive reload. No console errors or warnings. Owned downloaded comparison-aligned.ply is byte-identical to retained output; native CloudCompare reopens identical vertices and actual distance scalar fields with complete dual-source provenance. English and Portuguese settings verified."
        },
        {
          "command": "Portable HTML relative-asset audit and @Browser local HTTP log",
          "result": "PASS: 183 existing relative assets decode; all five CloudCompare pictures loaded in the local log. Lazy offscreen pictures initially had no natural width; scrolling and waiting verified each. App instructions and settings render in both English and Portuguese."
        }
      ],
      "pictures": [
        {
          "src": "assets/cloudcompare-browser-cross-route-settings.png",
          "caption": "Actual browser settings for an identified primary fit and a separate same-six-photo comparison reference; local native processing controls.",
          "date": "2026-09-30T08:26:19-03:00"
        },
        {
          "src": "assets/cloudcompare-browser-reopened.png",
          "caption": "Reloaded actual MakeHuman head processed by CloudCompare, with independent swept hair and goatee and synchronized current/proposed views. Coarse beard boundaries remain pending catalog refinement; synthetic input and fitted anatomy do not establish real accuracy.",
          "date": "2026-09-30T08:26:19-03:00"
        },
        {
          "src": "assets/cloudcompare-browser-portuguese.png",
          "caption": "Portuguese controls for actual surface sampling and rigid ICP. Native diagnostic report text remains technical English.",
          "date": "2026-09-30T08:26:19-03:00"
        },
        {
          "src": "assets/cloudcompare-three-upstream-comparison.png",
          "caption": "Actual upstream and CloudCompare converted GLB renders for MPFB, MakeHuman and FLAME. Conversion preserves geometry and preview; CloudCompare is a supporting component, not a photo reconstructor.",
          "date": "2026-09-30T08:26:19-03:00"
        },
        {
          "src": "assets/cloudcompare-native-distance-traces.png",
          "caption": "Actual native distance fields before and after cross-fit registration plus native RMS traces. Template disagreement and cropped neck surfaces contribute to distances; neither fitted template is measured ground truth.",
          "date": "2026-09-30T08:26:19-03:00"
        }
      ],
      "commits": [
        "1f865c7a9998dd6fb4231b3f04809edb8913de0e"
      ],
      "outputs": [
        {
          "href": "assets/cloudcompare-initial-failed-results.json",
          "label": "Actual initial failure results, no fallback head"
        },
        {
          "href": "assets/cloudcompare-ascii-precision-failed-results.json",
          "label": "Actual ASCII conversion failures and retained resources"
        },
        {
          "href": "assets/cloudcompare-provenance.json",
          "label": "Separate pinned software, native and Qt licensing, acquisition and build metadata"
        },
        {
          "href": "assets/cloudcompare-output-verification.json",
          "label": "Nine actual cross-route outputs and 153 real GLB checks"
        },
        {
          "href": "assets/cloudcompare-live-verification.json",
          "label": "Actual native behavior, failure and reference erasure checks"
        },
        {
          "href": "assets/cloudcompare-browser-native-result.json",
          "label": "Browser-queued custom settings and native comparison result"
        },
        {
          "href": "assets/cloudcompare-browser-style-loading.json",
          "label": "48 actual independent style loads with browser performance measurements"
        },
        {
          "href": "assets/cloudcompare-browser-camera-choices.json",
          "label": "Synchronized named angles and independent keep-current/clean-shaven checks"
        },
        {
          "href": "assets/cloudcompare-browser-persistence.json",
          "label": "Actual persisted option and workspace"
        },
        {
          "href": "assets/cloudcompare-browser-reload-download.json",
          "label": "Browser reload, downloaded PLY hash and native reader verification"
        },
        {
          "href": "assets/cloudcompare-makehuman-populated-results.json",
          "label": "Three MakeHuman upstream experiments compared to MPFB"
        },
        {
          "href": "assets/cloudcompare-blender-mpfb-populated-results.json",
          "label": "Three MPFB upstream experiments compared to MakeHuman"
        },
        {
          "href": "assets/cloudcompare-flame-populated-results.json",
          "label": "Three FLAME upstream experiments compared to MakeHuman"
        },
        {
          "href": "assets/cloudcompare-v1-output-verification.json",
          "label": "Retained earlier known-transform-only native evaluation"
        },
        {
          "href": "assets/open3d-provenance.json",
          "label": "Exact Matplotlib 3.11.2 plotting dependency license and primary package provenance"
        },
        {
          "href": "assets/cloudcompare-log-asset-audit.json",
          "label": "Portable log asset audit"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 14."
        },
        {
          "date": "2026-09-30T07:10:13-03:00",
          "text": "Begin CloudCompare native supporting alignment and comparison with an explicit fitted upstream dependency. Inspect approved candidate scope, current source, actual local CLI availability and primary current licenses before acquiring or changing the route."
        },
        {
          "date": "2026-09-30T07:21:15-03:00",
          "text": "Stable CloudCompare 2.13.2 source pinned to 49dbbb662f296c7780aae717897c85b3cb3764ed. Native prerequisites are Qt 5.15.19. Initial CMake attempts failed on missing Qt5Svg, then Qt5LinguistTools. Private dependency extraction/build in progress; no system packages or production changed."
        },
        {
          "date": "2026-09-30T07:33:01-03:00",
          "text": "Frontend check initially failed because the optional ICP fields were absent from the inferred fallback TypeScript type. Explicit ComponentSettings annotation applied before rerunning the required build."
        },
        {
          "date": "2026-09-30T07:33:52-03:00",
          "text": "First three actual CloudCompare runs failed: MAX_TCOUNT is a per-distance/ICP option in pinned 2.13.2, not a global command. No head published. Failed runs and summary retained; option moved into each actual native stage before new attempts."
        },
        {
          "date": "2026-09-30T07:36:01-03:00",
          "text": "Second actual native attempts completed sampling and cloud-to-mesh distances but failed the conversion publication gate: pinned RPly ASCII output rounded coordinates. Changed to binary little-endian PLY with strict typed decoding, exact triangle ordering and coordinate checks. No failed output is offered as a native head."
        },
        {
          "date": "2026-09-30T07:50:52-03:00",
          "text": "Adding an optional real cross-route fitted reference exposed the existing one-primary-source schema constraint: the queue and new regression test failed with HTTP 500. No run was retained. Added a distinct optional reference dependency table and unified recursive dependency view, preserving all existing source rows without replacement or backup flow."
        },
        {
          "date": "2026-09-30T08:26:19-03:00",
          "text": "Completed actual browser reload and download verification. A nonfocusable heading keyboard action timed out, then a focusable catalog filter provided the complete screenshot. One guessed Portuguese label did not match; the actual DOM label was used and verified. These automation failures did not change processing outcomes."
        },
        {
          "date": "2026-09-30T08:29:05-03:00",
          "text": "Native processing acceptance criteria verified. Full candidate journey remains pending task 14 with shared editing and expected-result history; professional acceptance and final route selection remain pending."
        }
      ]
    },
    {
      "id": "16",
      "title": "Client-specific refinements and direct editing",
      "depends": [
        "06",
        "07b",
        "10a",
        "11a"
      ],
      "requirement": "Provide meaningful written refinements and direct 3D changes within evaluated routes.",
      "criteria": [
        "Text refinements cause defined geometry/material changes with unsupported requests explained.",
        "Direct edits preserved in new revisions; synchronized client comparison and style independence retained.",
        "Missing coverage, likeness and clipping visible and checked; unmet quality requirements not marked complete."
      ],
      "status": "verified",
      "changes": [
        "Dependency correction: shared editing depends on the common viewer and viable fitted heads, not a failed photogrammetry route or the pending CUDA acceptance. Failed and blocked candidates remain retained and are not counted as completed demos.",
        "Implemented typed independent hair/beard mesh proportions, bounded crown/skin-normal volume and material tint, localized raycast brush with undo/reset, explicit written requests in English and Portuguese, and new immutable edited options. Current geometry and anatomy are excluded from editing.",
        "Added read-only native geometry verification using the exact TypeScript editor on retained GLBs. Moved brush centers/normals and world matrices out of the per-vertex loop to reduce repeated matrix updates and allocations. Current/reference original normals and vertex positions restore exactly when edits reset.",
        "Versioned deformation recipes preserve the failed v1 revision exactly. Corrected style-mesh-v2 protects the nape/temple attachment band and feathers crown/free-tip proportion changes. A real back-view defect was fixed and the corrected draft saved separately.",
        "Completed native-head editing, atomic supported written interpretation, independent style reset, immutable save/reopen and visible-surface brush occlusion. New edits use versioned attachment-preserving recipes; historical failed revisions remain inspectable."
      ],
      "limitations": [
        "Professional likeness, actual cut feasibility and acceptance remain pending. The fitted head includes inferred hidden surfaces. Current styles are manually selected references; edits reshape proposal style meshes and do not alter anatomy.",
        "Written interpretation has documented English/Portuguese requests and exact values. Unsupported requests reject atomically. It is a local deterministic interpreter rather than an unrestricted language model.",
        "The representative catalog still has coarse beard silhouettes and clipping limitations requiring task 15. Brush hits visible mesh geometry; transparent hair-card texels are not individually sampled for hit testing. A stroke can cross nearby overlapping style surfaces inside its bounded radius.",
        "Formal revision lineage, selected expected results and selection history remain task 17. Task 16 verifies immutable edited recipes and reload/reopen, not those unfinished workflows."
      ],
      "verification": [
        {
          "command": "Go focused written/brush/auth/revision tests and go test ./...; npm --prefix web run build",
          "result": "PASS. First test compile incorrectly treated fixture user ID as a user struct; corrected to a separate test studio/session and verified 404 isolation. Unsupported mixed requests reject atomically, styles/strokes bounds validate, earlier options are preserved, and source erasure removes edited revisions."
        },
        {
          "command": "@Browser initial written-request and direct brush checks",
          "result": "Actual style vertex displacement observed: 90480 changed proposed vertices, maximum 17.154447mm; current reference has zero changed vertices. Mixed request shorter hair; remove nose returns unsupported explanation and leaves the geometry unchanged. Actual pointer raycast produces a localized hair stroke with retained point/normal. Full save/reload/compatibility checks still in progress."
        },
        {
          "command": "node scripts/verify-proposal-edits.mjs",
          "result": "PASS: 288 real native style assets from 18 jobs, actual vertex/normals/topology/UV checks, protected root band, localized brush, deterministic replay, 64-stroke 25mm cap, exact reset and unchanged source heads. Initial v1 mathematical checks passed but visual back-view verification exposed a nape gap; v2 includes protected-band checks and corrected visual verification."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; go test -race ./internal/app; npm --prefix web run build",
          "result": "PASS all checks after the final occlusion change. Frontend retains the existing large demo bundle warning (699.60 kB); no build error."
        },
        {
          "command": "@Browser final v2 editing flow",
          "result": "PASS saved recipe reload; actual proposed 90233 changed vertices, maximum 14.525503mm; current 0. Forehead click missed and retained one stroke; visible hair hit changed 40 vertices and undo restored exact prior recipe. All six camera angles matched across views and retained geometry fingerprints. Console errors/warnings empty on final reload."
        },
        {
          "command": "node scripts/verify-proposal-edits.mjs",
          "result": "PASS exact app deformation on 288 native style GLBs from 18 jobs in 24.356s. Sources and heads unchanged; protected attachment band, deterministic replay, bounded brush displacement, reset normals/positions, preserved UV/topology. This is geometry verification, not observed client accuracy."
        },
        {
          "command": "Portable HTML asset audit",
          "result": "Initial audit used incompatible system Python; retried with the private Python 3.12 environment. Log server had stopped; restarted on loopback. Final PASS: all relative referenced assets exist, image decoding succeeds and HTTP returns 200."
        },
        {
          "command": "@Browser HTML log reload and selector",
          "result": "PASS current verified task 16 and all four linked pictures complete with natural width 1331. A heading focus attempt timed out; ordinary page scrolling loaded the final lazy image."
        }
      ],
      "pictures": [
        {
          "src": "assets/editing-browser-back.png",
          "caption": "Failed v1 shortening exposes a nape gap in the actual proposed hair. Geometry change was real but this attachment defect is not accepted as completed quality.",
          "date": "2026-09-30T09:10:42-03:00"
        },
        {
          "src": "assets/editing-browser-back-reset.png",
          "caption": "Resetting only the hair restores the original attachment at the same back angle while preserving the independently narrowed brown beard. This isolates the gap to the v1 deformation.",
          "date": "2026-09-30T09:10:42-03:00"
        },
        {
          "src": "assets/editing-browser-v2-back.png",
          "caption": "Corrected v2 preserves the nape attachment at the same back angle. The failed v1 remains retained separately.",
          "date": "2026-09-30T09:34:03-03:00"
        },
        {
          "src": "assets/editing-browser-v2-final.png",
          "caption": "Actual synchronized edited proposal after reload, visible-surface brush checks and undo. Hair 85% length with 8mm crown adjustment; independent brown beard at 90% width. Synthetic client and inferred fitted geometry; professional review pending.",
          "date": "2026-09-30T09:34:03-03:00"
        }
      ],
      "commits": [
        "82cf3f11893d2f8c3f52f2e4a8d0b58076981bf2"
      ],
      "outputs": [
        {
          "href": "assets/editing-browser-written.json",
          "label": "Initial actual written geometry measurements"
        },
        {
          "href": "assets/editing-browser-unsupported.json",
          "label": "Unsupported request and unchanged edit state"
        },
        {
          "href": "assets/editing-native-geometry-verification.json",
          "label": "Corrected v2 actual native geometry and attachment checks"
        },
        {
          "href": "assets/editing-native-geometry-v1-verification.json",
          "label": "Historical v1 numeric verification, before visual gap discovery"
        },
        {
          "href": "assets/editing-v2-actual-persistence.json",
          "label": "Separate corrected v2 and failed v1 saved revisions with original head hash"
        },
        {
          "href": "assets/editing-browser-v2-reloaded.json",
          "label": "Actual corrected geometry after browser reload"
        },
        {
          "href": "assets/editing-browser-v2-occlusion.json",
          "label": "Actual face miss, visible hair hit and exact undo measurements"
        },
        {
          "href": "assets/editing-browser-v2-camera-checks.json",
          "label": "Six synchronized v2 angles and actual geometry fingerprints"
        },
        {
          "href": "assets/editing-browser-independent-reset.json",
          "label": "Independent hair reset preserves beard edit"
        },
        {
          "href": "assets/editing-browser-undo.json",
          "label": "Initial localized brush undo measurements"
        },
        {
          "href": "assets/editing-browser-option-reopened.json",
          "label": "Original edited option reopened in browser"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T08:31:10-03:00",
          "text": "Starting typed independent geometry/material refinements, written-request interpretation with explicit supported scope, direct localized 3D brush and immutable saved edited revisions."
        },
        {
          "date": "2026-09-30T08:47:40-03:00",
          "text": "Browser reload responded slowly and initial reported FPS was zero during background verification, with 18.5/39s load readings. Retained as an observed limitation, not used as a responsive browser performance claim. Native accessibility restored inspection; no alternative browser or raw CDP used."
        },
        {
          "date": "2026-09-30T08:59:46-03:00",
          "text": "Initial full geometry verification exercised 64 strokes on every style and took minutes. Optimized real brush evaluation before repeating checks; did not use that long verification as a browser performance result."
        },
        {
          "date": "2026-09-30T09:10:42-03:00",
          "text": "Six synchronized angle checks exposed a v1 hair attachment gap at the nape. Preserving the existing immutable failed revision and versioning a corrected deformation that protects the root band while changing crown proportions and free long tips. No failed revision is silently rewritten."
        },
        {
          "date": "2026-09-30T09:23:15-03:00",
          "text": "Latest browser reload observed 293/381ms mesh loads and 150/165 initial FPS. Earlier slow reloads and zero-FPS background measurements remain retained; this short measurement is not a device stress benchmark. Added occlusion guard so a click on visible head anatomy cannot edit hidden hair behind it."
        },
        {
          "date": "2026-09-30T09:34:03-03:00",
          "text": "Task 16 technical acceptance verified locally. Preserved failed attachment revision and corrected separate v2; next task is the expected-result gallery and selection history."
        }
      ]
    },
    {
      "id": "17",
      "title": "Explored options, expected selections and history",
      "depends": [
        "16"
      ],
      "requirement": "Persist all alternatives, revisions and chosen expected results in the journey.",
      "criteria": [
        "Every explored option retained; selected state and rationale visible.",
        "Changing selection preserves earlier selections and revisions; reload/reopen verified.",
        "Expected, reference and actual material visibly distinguishable; failure cannot become successful preview."
      ],
      "status": "verified",
      "changes": [
        "Reversible defaults: expected choices attach to a specific consultation revision; new selections append events and update a versioned current pointer. Studio records professional review and client agreement method, with an explicit synthetic demonstration method for fictional cases. Native fit quality remains subject to professional review.",
        "Added private retained browser-render pictures with JPEG decoding and metadata removal; pictures cascade with their immutable option. Added parent/root/revision metadata without overwriting legacy options. Gallery includes every candidate and current/earlier selection badges.",
        "Added immutable revision lineage and private retained browser pictures, a gallery across candidates, consultation-scoped current expected choices and append-only selection/clear history. Agreement records explicitly distinguish fictional demonstrations from professional-recorded client agreement. Client records link to the exact chosen version.",
        "Selection validates corrected fit and processing versions recursively through both primary and comparison-reference dependencies. Mannequin-only inspections, incomplete six-view inputs, failed output and known historical fit/style defects cannot qualify. Native renders pause when offscreen or unchanged; camera updates no longer recompute mesh edits."
      ],
      "limitations": [
        "Professional assessment remains pending. Studio-recorded agreement is not an authenticated client signature. Synthetic examples are simulated and do not establish real likeness, feasibility or actual haircut outcomes. Beard catalog quality remains pending task 15.",
        "Existing pre-gallery options have no retained picture until their actual meshes are reopened and a picture is captured. This is visibly labeled. Captures illustrate a saved camera; authoritative persisted native geometry and recipes reopen independently.",
        "IAB navigation and some Playwright actions intermittently time out. Working native controls passed all six synchronized angles. Background FPS is unavailable; no performance improvement claim is inferred from the rendering change. Existing 703 KB demo bundle warning remains.",
        "Intermediate comparison screenshot displays the superseded FPS sampling bug. Corrected sampling excludes offscreen/hidden pauses; foreground frame rate is not inferred from background measurements."
      ],
      "verification": [
        {
          "command": "go test ./internal/app -run Expected -count=1",
          "result": "PASS API invariants: separate revisions, agreement required, stale 409, reopening DB, selection/clear/reselection history, native source cancellation removes dependent pictures and selections without resurrecting earlier choices, withdrawal purges agreement notes, mannequin/historical native fit and foreign consultation rejection."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS all packages; internal/app 0.978 s."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS 7.519 s."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS TypeScript and Vite, 1.38 s; existing demo bundle size warning."
        },
        {
          "command": "private Python scripts/verify-local-expected-results.py",
          "result": "PASS actual retained browser pictures, immutable lineage and four-event synthetic history; anonymous 401, cross-client 404, stale 409; actual same-six-source MakeHuman fit, source erasure removed native head/picture/options/selection events, preserved version without resurrection, withdrawal denied recreation. Optional crown/under-chin copied but excluded from fitting."
        },
        {
          "command": "IAB gallery and client record",
          "result": "PASS first proposal 85% hair reopened independently of revision 2 at 90%; both retain one brush stroke and 90% brown goatee. Select/select/clear/reselect creates version 4 and preserves four events. Client record loads the chosen revision and links to its exact saved version."
        },
        {
          "command": "IAB six named angles on reopened revision 2",
          "result": "PASS matched azimuth/elevation/distance in both canvases and unchanged current style vertices. Proposed fingerprint e327243e differs from earlier 82afc9d2; source head is retained independently."
        },
        {
          "command": "IAB client-record exact-option link after API restart and fresh page load",
          "result": "PASS revision 2 hair 90%, goatee 90% brown, one retained brush stroke, selection version 4, native current 0 changed vertices and proposed 90233; console warnings/errors empty."
        },
        {
          "command": "Portable HTML and image audit",
          "result": "PASS 207 relative references, all files present and HTTP 200; 83 PNG/JPEG/SVG pictures decoded; exactly one active implementation task."
        },
        {
          "command": "npm --prefix web run build after FPS correction",
          "result": "PASS 1.61 s; TypeScript and Vite, existing 703 KB demo chunk warning."
        },
        {
          "command": "IAB corrected foreground sample after exact-option reload",
          "result": "PASS current 213315 triangles, 12.7 MB, 292 ms mesh load, 115.4 initial FPS; proposed 78946 triangles, 5.9 MB, 209 ms load, 124.6 initial FPS. One contiguous foreground run, warm local cache; console empty. No cold-load or professional quality inference."
        }
      ],
      "pictures": [
        {
          "src": "assets/expected-history-2026-09-30.png",
          "caption": "Earlier two selected versions and explicit synthetic agreement labels. This intermediate state preceded clearing and reselection.",
          "date": "2026-09-30T10:24:21-03:00"
        },
        {
          "src": "assets/expected-gallery-2026-09-30.png",
          "caption": "Gallery labels revision 2, its parent, current expected selection and earlier selected revision. Images are captured separately below.",
          "date": "2026-09-30T10:24:21-03:00"
        },
        {
          "src": "assets/expected-gallery-pictures-2026-09-30.png",
          "caption": "Actual retained browser renders of the two independent saved camera states. Synthetic fitted geometry and coarse demo beard, not professional acceptance.",
          "date": "2026-09-30T10:24:21-03:00"
        },
        {
          "src": "assets/expected-client-record-2026-09-30.png",
          "caption": "Client record reopened with current selection version 4 and preserved history.",
          "date": "2026-09-30T10:24:21-03:00"
        },
        {
          "src": "assets/expected-reopened-comparison-2026-09-30.png",
          "caption": "Actual meshes reopened through the selected-version link on a fresh client page. Current reference stays unchanged; this is synthetic fitted geometry and pending catalog quality.",
          "date": "2026-09-30T10:25:48-03:00"
        },
        {
          "src": "assets/expected-reopened-final-2026-09-30.png",
          "caption": "Fresh reload of the selected revision after correcting active-frame sampling. Both actual meshes reopen at the retained quarter angle; current reference is unchanged.",
          "date": "2026-09-30T10:29:59-03:00"
        }
      ],
      "commits": [
        "c1f348bbe008ca04567bbaba7dc1b71df7ff6b0d"
      ],
      "outputs": [
        {
          "href": "assets/expected-live-verification.json",
          "label": "Actual local privacy and immutable proposal verification"
        },
        {
          "href": "assets/expected-camera-verification.json",
          "label": "Actual synchronized angle and unchanged-current measurements"
        },
        {
          "href": "assets/expected-browser-performance.json",
          "label": "Corrected actual foreground browser performance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T09:38:21-03:00",
          "text": "Begin options gallery, explicit revision lineage, consultation-scoped expected selections and preserved agreement/selection history. Later broad MVP and expected-result ticket govern scope; mannequin inspection or failed processing cannot qualify as a client expected result."
        },
        {
          "date": "2026-09-30T09:50:52-03:00",
          "text": "Initial compile failed after a repeated text replacement inserted transactional cleanup into filesystem cleanup too. Removed the extra insertion and verified the correct database transaction erases selection data on withdrawal."
        },
        {
          "date": "2026-09-30T10:24:21-03:00",
          "text": "Real browser select/select/clear/reselect and actual fitted-source deletion passed. Historical upstream gating now checks both dependency branches. Navigation timeouts were inspected before further actions; no timed-out attempt is counted as success."
        },
        {
          "date": "2026-09-30T10:28:03-03:00",
          "text": "Visual comparison exposed a misleading 0 initial FPS: sampling included an offscreen interval. Changed the initial sample to a contiguous visible foreground interval and retain fractional FPS; mesh loading time remains measured separately. Earlier screenshot is retained as intermediate evidence."
        },
        {
          "date": "2026-09-30T10:32:04-03:00",
          "text": "Technical gallery/history task verified locally. Earlier options remain immutable, linked revisions and four-event selection history reopen, and actual native source deletion purges dependent content without restoring an earlier selection. Professional assessment, fuller catalog and final route choice remain pending."
        }
      ]
    },
    {
      "id": "07",
      "title": "Blender + MPFB complete demo verification",
      "depends": [
        "06",
        "07a",
        "16",
        "17"
      ],
      "requirement": "Fit shared photos using actual MPFB, explicit cameras, landmarks and bounded render iterations.",
      "criteria": [
        "Exact software and bundled model/asset licenses verified separately.",
        "Reproducible fit, matched renders, independent styles, editing, option selection and reopening.",
        "Fit versus observation and hidden inference labeled; iterations, resource use, output size, likeness/clipping failures recorded."
      ],
      "status": "verified",
      "changes": [
        "Added an actual private six-view outline diagnostic after native export: compare authorized input pixels, neutral fitted renders and image-plane overlays using only retained framing translations. Uniform-background checks make metrics unavailable when masking is unreliable. No hidden scalp or geometric accuracy is inferred, and geometry is not fitted to existing hair silhouettes.",
        "A fresh browser-started MPFB experiment e67dbec6-115e-40c6-a1e8-539e2a791aea processed the same six authorized synthetic source views and retained actual native/interchange models, six outline pictures and all settings. Native head bytes match the preceding corrected fit, so the diagnostic did not change fitted geometry.",
        "Completed Alex synthetic MPFB evaluation: actual six-photo fit, independent style changes, keep-current hair plus clean-shaven alternative, written 90% hair/5mm volume/90% beard width/brown tint, actual 20mm-radius 3mm hair brush affecting 46 additional vertices, six synchronized angles, revision 2 and simulated expected choice in a separate consultation. Reopened actual revision with matching fingerprint and 277906 changed proposed vertices; current reference unchanged.",
        "Verified the complete local MPFB technical journey using actual fitting, independent styles, refinements, actual browser proposal pictures, simulated consultation selection and reopen. All earlier failed fits and alternatives remain retained. No professional likeness or cut-feasibility acceptance is claimed."
      ],
      "limitations": [
        "Professional recognizability and feasibility assessment remain pending. Catalog expansion and coarse beard cleanup are tracked in task 15; no six-photo measured-geometry claim is made.",
        "Opening an explicit old option link overrides the saved workspace on reload by design. The new revision has its own retained link; opening that link reopens the exact saved state. Historic native job reports retain their creation-time full-journey-pending wording; subsequent separate verification establishes the saved workflow without modifying those reports."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./internal/app -run TestSilhouette/TestNative -count=1",
          "result": "PASS output serving/privacy boundaries: completed owned fit only, unlisted paths denied, symlink escape denied, source erasure removes the outline artifact. Real native evaluation follows."
        },
        {
          "command": "IAB Fit head locally with MPFB plus actual API/native outputs",
          "result": "PASS real run completed in 59.711 s, 111141642 retained bytes, 56 paired landmarks, 97 evaluations, 2.90 px mean framed landmark residual. Native target prediction max 0.166 micrometres for 4701 mapped vertices. Six outline checks available, input-mask overlaps 0.882-0.916; these are not 3D error or professional likeness."
        },
        {
          "command": "go test ./...",
          "result": "PASS via mise Go 1.26.0; cached appropriate packages."
        },
        {
          "command": "go test -race ./internal/app",
          "result": "PASS, 8.619s."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS, 2.03s; existing 703.97 kB demo bundle warning retained."
        },
        {
          "command": "Uniform-background outline negative fixture",
          "result": "Initial verification fixture failed because private input has .image suffix and Pillow requires explicit format. Corrected fixture to PNG; actual nonuniform front reports unavailable with null overlap and null difference count, five uniform views remain available."
        },
        {
          "command": "python scripts/verify-local-candidate-journey.py blender-mpfb",
          "result": "PASS real native head and four separate current/proposed styles, two actual browser JPEGs, immutable revision lineage, synthetic expected result, saved workspace, anonymous denial, stale conflict, unsupported mixed request atomicity, unlisted asset and invalid camera rejection."
        },
        {
          "command": "Portable HTML audit and @Browser selector",
          "result": "PASS 216 relative resources HTTP 200, 89 raster or SVG evidence pictures valid. Browser task selector reloaded current 07 entry, native report links, images and dated captions. First raster-only audit rejected a valid SVG; corrected SVG handling and reran successfully."
        }
      ],
      "pictures": [
        {
          "src": "assets/mpfb-journey-outline-front.png",
          "caption": "Actual synthetic front input, neutral fitted render and pixel outlines. Existing hair/beard contribute to the green outline; this does not measure the hidden head.",
          "date": "2026-09-30T10:54:37-03:00"
        },
        {
          "src": "assets/mpfb-journey-outline-back.png",
          "caption": "Actual synthetic rear input and the inferred bald template. No back facial landmarks or recovered hidden scalp are claimed.",
          "date": "2026-09-30T10:54:37-03:00"
        },
        {
          "src": "assets/mpfb-journey-outline-ui-2026-09-30.png",
          "caption": "Actual retained six-angle outline diagnostic panel. Neutral fitted surface is inferred; green observed image masks include existing styles and shoulders.",
          "date": "2026-09-30T11:15:15-03:00"
        },
        {
          "src": "assets/mpfb-journey-edit-2026-09-30.png",
          "caption": "Intermediate front proposal after meaningful written mesh changes. Clicking bare facial skin correctly found no selected hair surface; the subsequent real hair hit retained one stroke.",
          "date": "2026-09-30T11:15:15-03:00"
        },
        {
          "src": "assets/mpfb-journey-reopened-2026-09-30.png",
          "caption": "Actual saved edited MPFB proposal reopened through its revision link at the same three-quarter camera. Coarse beard attachments remain visible and tracked for catalog work; this is synthetic, not professional acceptance.",
          "date": "2026-09-30T11:15:15-03:00"
        },
        {
          "src": "assets/mpfb-journey-expected-2026-09-30.png",
          "caption": "Simulated expected-result selection recorded for the dedicated synthetic MPFB consultation. Review/agree checkboxes reset after saving; the synthetic label remains selected. This record does not establish professional acceptance.",
          "date": "2026-09-30T11:18:02-03:00"
        }
      ],
      "commits": [
        "9231f129421e32aec5edb60af4d64a95629f8c7a"
      ],
      "outputs": [
        {
          "href": "assets/mpfb-journey-native-result.json",
          "label": "Actual fresh native fit, resources and six outline diagnostics"
        },
        {
          "href": "assets/makehuman-core-provenance.json",
          "label": "Exact MPFB code, CC0 core assets and Blender license provenance"
        },
        {
          "href": "assets/native-mpfb-provenance.json",
          "label": "Exact detector, model, Python and dependency provenance"
        },
        {
          "href": "assets/mpfb-journey-cameras.json",
          "label": "Actual six-angle synchronized transforms and edit measurements"
        },
        {
          "href": "assets/blender-mpfb-journey-verification.json",
          "label": "Live native artifacts, retained browser pictures, saved choices and failure checks"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T10:36:39-03:00",
          "text": "Begin complete Blender + MPFB demo journey validation using the corrected native fit, shared six synthetic views, real independent style assets and now-verified refinement/expected-result workflow. Earlier native fitting is evidence, not completion of this journey."
        },
        {
          "date": "2026-09-30T10:49:01-03:00",
          "text": "Native surface fitting remains a bounded 2D landmark objective. The outline stage evaluates visible differences and preserves its limits explicitly. An initial patch failed to match the long diagnostic map line and applied no changes; corrected before checks."
        },
        {
          "date": "2026-09-30T10:54:37-03:00",
          "text": "Outline pictures visually inspected. Differences include hair silhouette, shoulder crop and internal color boundaries; metrics remain explicitly image-mask diagnostics. Professional recognizability and catalog quality are not marked accepted."
        },
        {
          "date": "2026-09-30T11:15:15-03:00",
          "text": "Browser reload of original earlier option link correctly reopened that old option. Opening the newly saved revision link restored the edited state and simulated evaluation expected result. All technical journey checks passed; final professional judgment remains pending."
        },
        {
          "date": "2026-09-30T11:17:39-03:00",
          "text": "Technical acceptance verified locally. Committing coherent MPFB diagnostic and complete journey evidence before advancing to the next candidate. Model/style professional assessment and route choice remain explicitly pending."
        }
      ]
    },
    {
      "id": "08",
      "title": "COLMAP / PyCOLMAP complete demo verification",
      "depends": [
        "06",
        "08a",
        "16",
        "17"
      ],
      "requirement": "Reconstruct the agreed six photos through real COLMAP processing.",
      "criteria": [
        "Actual extraction, matching and reconstruction retained, including sparse capture failures.",
        "Successful outputs support shared styles, edits, selections and reopen; unmet requirements explicitly labeled.",
        "No denser capture substituted; versions, licenses, settings, timing, coverage and resources recorded."
      ],
      "status": "failed",
      "changes": [
        "The selector opens the actual COLMAP reconstruction controls, authorized baseline six photos, presets, queue status, retained matching graph, three mapping attempts, metrics and failure requirements. Fresh browser-started run 3e7b3c02-1f94-44a0-8c87-e2bc765abe5f retains no sparse model; prior standard and sensitive-calibrated experiments across all three fictional cases remain available."
      ],
      "limitations": [
        "Actual same-six-photo COLMAP reconstruction produced no usable head. Independent replacement styles, client-head synchronization/refinements and an expected-result journey are unmet. Shared mannequin references are explicitly labeled as references and are not a candidate reconstruction result. No fallback or unapproved denser capture is counted as success."
      ],
      "verification": [
        {
          "command": "@Browser same-six-photo COLMAP reconstruction and CLI retained report",
          "result": "Actual 863ms reconstruction, 6609380 retained bytes, 226-320 SIFT features per view, all 15 pairs attempted, three mapping trials all 0 models. Head HTTP404; retained report HTTP200; anonymous report HTTP401. Actual match graph decoded and visually inspected. No new app change; native privacy/cancellation/failure regression checks and software/model provenance are retained under 08a."
        }
      ],
      "pictures": [
        {
          "src": "assets/colmap-journey-failure-2026-09-30.png",
          "caption": "Actual failed standard six-photo COLMAP run. Failure and absent geometry are explicit; no head or editable proposal is claimed.",
          "date": "2026-09-30T11:21:03-03:00"
        },
        {
          "src": "assets/colmap-journey-matches.png",
          "caption": "Actual verified-feature-match graph from the fresh six-photo experiment. Sparse matching did not create a usable reconstruction.",
          "date": "2026-09-30T11:21:03-03:00"
        }
      ],
      "commits": [
        "f3f8d466031938b200c098042a39feca4d70ce4e"
      ],
      "outputs": [
        {
          "href": "assets/colmap-journey-failure.json",
          "label": "Fresh actual settings, native report and unmet journey requirements"
        },
        {
          "href": "assets/colmap-provenance.json",
          "label": "Exact COLMAP software and wheel provenance retained under 08a"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T11:18:29-03:00",
          "text": "Inspecting the complete COLMAP candidate from the same authorized six views. Earlier native experiments failed to recover a model; verify the runnable failure workflow and preserve unmet requirements instead of supplying another route as its result."
        },
        {
          "date": "2026-09-30T11:21:03-03:00",
          "text": "Complete experiment retained with failed product requirements. This candidate remains selectable and runnable; professional review may assess failure evidence but no functional head journey is marked complete."
        }
      ]
    },
    {
      "id": "09",
      "title": "Meshroom / AliceVision complete demo verification",
      "depends": [
        "06",
        "09a",
        "16",
        "17"
      ],
      "requirement": "Run the same input through the actual photogrammetry pipeline.",
      "criteria": [
        "Runnable workflow and real retained outputs or explicit processing failures.",
        "Full viewer/options journey where viable; hardware/setup/resource/coverage limitations recorded.",
        "Licenses and exact versions verified; same six inputs, no hidden fallback."
      ],
      "status": "blocked",
      "changes": [
        "Pinned Meshroom 2025.1.0 and AliceVision 3.3.0 source checkouts and actual 11-node/13-edge prepared graph remain retained. Added explicit English/Portuguese selector notice explaining the missing native runtime, terms blocker and absent reconstructed head/expected result."
      ],
      "limitations": [
        "Exact CUDA 12.1.1 EULA acceptance remains pending. Official binary acquisition, native six-photo processing and full style/refinement/expected-result/reopen workflow are not implemented or verified. Actual prepared graph is configuration evidence only. No substitution is counted as Meshroom success."
      ],
      "verification": [
        {
          "command": "Pinned source, graph and native acquisition state",
          "result": "PASS actual source commits 024b6f398c67bec4968a29a2c5744e49e2bab9b8 and 928bac2689461ffb6f0174609f983a16bdbd2b30. Actual graph has 11 nodes and 13 edges. Native archive/runtime absent; no reconstruction asserted."
        },
        {
          "command": "go test ./...; npm --prefix web run build",
          "result": "PASS via Go 1.26.0; frontend 1.53s, existing 704.52kB chunk warning."
        },
        {
          "command": "@Browser Meshroom selector after frontend rebuild",
          "result": "PASS actual selection shows explicit runtime/terms blocker, six authorized source views and absence of candidate reconstruction result. Accessible native dropdown succeeded after the earlier semantic label mismatch. No native acquisition performed."
        }
      ],
      "pictures": [
        {
          "src": "assets/meshroom-journey-blocked-2026-09-30.png",
          "caption": "Meshroom remains selectable with exact runtime blocker and six authorized inputs. No client head or expected result is claimed.",
          "date": "2026-09-30T11:25:48-03:00"
        }
      ],
      "commits": [
        "0d687ecf87ca7158a4e52b2a6ca0fa6425ac8581"
      ],
      "outputs": [
        {
          "href": "assets/meshroom-prepared-graph.json",
          "label": "Actual registered graph and classical six-view settings"
        },
        {
          "href": "assets/meshroom-setup-provenance.json",
          "label": "Pinned code licenses and exact native runtime acquisition blocker"
        },
        {
          "href": "assets/meshroom-python-provenance.json",
          "label": "Separate Qt/PySide and Python package provenance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T11:21:54-03:00",
          "text": "Checking the actual Meshroom selector, retained native graph and acquisition state. CUDA 12.1.1 agreement remains unaccepted, so no bundled AliceVision binary is acquired or run."
        },
        {
          "date": "2026-09-30T11:25:05-03:00",
          "text": "Browser initial semantic label selection failed to match; native accessibility dropdown selection succeeded. Later reload observed 22.45s before Loading workspace. Retaining this browser delay as a limitation, not a responsive-performance claim."
        },
        {
          "date": "2026-09-30T11:25:48-03:00",
          "text": "Blocked candidate retained and explained. Continuing the next independent candidate; no blocked workflow marked complete."
        }
      ]
    },
    {
      "id": "10",
      "title": "Standalone MakeHuman complete demo verification",
      "depends": [
        "06",
        "10a",
        "16",
        "17"
      ],
      "requirement": "Fit and export an actual MakeHuman template without Blender.",
      "criteria": [
        "Template adjustment, photo alignment, export and independent style application runnable.",
        "Refine/edit, save options, choose expected and reopen; likeness professional review pending.",
        "Code and models cleared separately; fitted/inferred geometry, iteration and resource metrics retained."
      ],
      "status": "verified",
      "changes": [
        "Visual full-journey check found actual MakeHuman beard strands on the nose. Traced placement to the upstream rig mouth joint, which is not the visible lip surface. Corrected placement to the actual fitted template vertices corresponding to neutral front upper/lower lip landmarks 13/14; added retained versioned attachment metadata, explicit historical warning and expected-result rejection of broken primary style sources. Comparison-only reference geometry does not contribute style attachment.",
        "Regenerated all three standalone MakeHuman fits with visible-lip surface correspondences mapped to original Human vertices. Historical failed attachments and diagnostics remain retained. New expected selections reject obsolete MakeHuman beard attachments, including primary supporting-route ancestors.",
        "Camera, edit and resize updates render immediately; actual rendered camera metadata verifies synchronized buffers across all six named angles."
      ],
      "limitations": [
        "Not implemented or verified.",
        "This Browser session recorded 1.9 initial FPS and 34-51 s load readings with repeated input/focus timeouts. These measurements are retained, not claimed as acceptable customer performance. Retest and address demo browser performance before final handoff."
      ],
      "verification": [
        {
          "command": "Actual local API response measurements during browser recovery",
          "result": "GET library 8000 serialized bytes in 1ms; 62 jobs 859875 bytes in 10ms; 53 options 80026 bytes in 3ms; workspace 1792 bytes in 1ms; permission 719 bytes under1ms. No API error. Browser control reports focus/input acknowledgement timeouts, so those durations are not attributed to server performance."
        },
        {
          "command": "Corrected actual native lip experiment",
          "result": "Run 94508d2f completed in 15.498s with 81497531 retained bytes. Visible lip basis vertices 482/523 map to original native Human vertices 468/520, mouth Z .003871655m. Head bytes unchanged from the failed attachment experiment; original and corrected results remain retained. Full browser styling and final journey verification are still pending."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/native-demos/verify-makehuman-assets.py --style-version makehuman-visible-lips-v2",
          "result": "PASS 51 actual GLBs, 18 native renders, identical six source-photo hashes, correct style version and visible-lip mapping, finite geometry and beard coverage envelopes; corrupted target basis rejected without publishing a head."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/verify-local-candidate-journey.py makehuman",
          "result": "PASS actual corrected run, two browser-rendered alternative/revision pictures, synthetic expected result, workspace persistence, anonymous denial, stale update 409, atomic unsupported request 400 and unlisted asset 404."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; mise exec go@1.26.0 -- go test -race ./internal/app; npm --prefix web run build",
          "result": "PASS all Go packages and race checks (cached); frontend typecheck/build passed in 1.38 s. Existing 705 kB demo chunk warning remains."
        },
        {
          "command": "Browser exact saved revision reload and rendered-camera inspection",
          "result": "PASS native run 94508d2f, independent short01/goatee, bounded written recipe and one 20mm/3mm stroke replayed; current geometry unchanged; selected synthetic expected result version 1 visible; browser error/warning logs empty."
        },
        {
          "command": "Portable HTML log HTTP and picture audit after restarting the loopback server",
          "result": "PASS 235 relative resources returned HTTP 200 with matching byte sizes; 98 linked raster/SVG pictures decoded or parsed."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./... and go test -race ./internal/app after reference-only style eligibility regression update",
          "result": "PASS app tests 0.953 s; race checks 7.846 s. Broken primary style ancestor rejected, comparison-only reference does not supply styles, and obsolete geometric ancestors remain rejected."
        }
      ],
      "pictures": [
        {
          "src": "assets/makehuman-journey-edit-2026-09-30.png",
          "caption": "Failed intermediate actual MakeHuman styled fit: beard strands visibly occupy the nose. This is an implementation defect, not deferred professional judgment. Preserved while a new corrected native experiment runs.",
          "date": "2026-09-30T11:39:51-03:00"
        },
        {
          "src": "assets/makehuman-journey-reopened-2026-09-30.png",
          "caption": "Reopened actual standalone MakeHuman revision after visible-lip correction. Same fitted head and front camera; separate current stubble and proposed brown goatee. Blocky beard coverage remains for catalog cleanup, not professional acceptance.",
          "date": "2026-09-30T12:22:19-03:00"
        },
        {
          "src": "assets/makehuman-journey-expected-result-2026-09-30.png",
          "caption": "Actual retained browser proposal selected for a dedicated synthetic MakeHuman consultation; history preserved and professional acceptance explicitly pending.",
          "date": "2026-09-30T12:22:19-03:00"
        },
        {
          "src": "assets/makehuman-journey-corrected-comparison-2026-09-30.png",
          "caption": "Intermediate failed comparison capture: shared zoom had changed but one canvas still showed its previous frame. Immediate rendering fixes the synchronization defect; this is failure evidence.",
          "date": "2026-09-30T12:22:19-03:00"
        },
        {
          "src": "assets/makehuman-six-fitted-renders-visible-lips.png",
          "caption": "Actual standalone fitted head at six labeled angles from the corrected native run; entirely fitted or inferred geometry, synthetic inputs.",
          "date": "2026-09-30T12:22:19-03:00"
        },
        {
          "src": "assets/makehuman-journey-corrected-edits-2026-09-30.png",
          "caption": "Actual written hair/beard deformation and local hair brush inspection. Corrected lower-face beard placement; both views share the same client geometry.",
          "date": "2026-09-30T12:25:19-03:00"
        },
        {
          "src": "assets/makehuman-journey-clean-shaven-front-2026-09-30.png",
          "caption": "Intermediate viewport capture missed the model surfaces while scrolling. Retained as a capture failure; it is not beard placement verification.",
          "date": "2026-09-30T12:25:19-03:00"
        },
        {
          "src": "assets/makehuman-journey-corrected-neutral-styles-2026-09-30.png",
          "caption": "Intermediate viewport capture showed the selector instead of the comparison. Later reopened picture supplies the visual verification.",
          "date": "2026-09-30T12:25:19-03:00"
        }
      ],
      "commits": [
        "bfa51d1c052e968bd1041af0fbce7557020a5e83"
      ],
      "outputs": [
        {
          "href": "assets/makehuman-journey-native-result.json",
          "label": "Actual failed attachment experiment and outline diagnostics"
        },
        {
          "href": "assets/makehuman-journey-correction-failure.json",
          "label": "Actual failed correction and native diagnostics"
        },
        {
          "href": "assets/makehuman-journey-corrected-native-result.json",
          "label": "Actual final native-index-stable lip attachment, unchanged head and processing resources"
        },
        {
          "href": "assets/makehuman-journey-intermediate-lip-result.json",
          "label": "Retained intermediate direct cropped-index lip attachment; superseded by stable native mapping"
        },
        {
          "href": "assets/makehuman-populated-visible-lips-results.json",
          "label": "Actual corrected standalone fits on all three fictional cases"
        },
        {
          "href": "assets/makehuman-output-verification-visible-lips.json",
          "label": "Actual corrected native geometry and corrupt-basis rejection evidence"
        },
        {
          "href": "assets/makehuman-journey-verification.json",
          "label": "Persisted complete synthetic MakeHuman journey and failure checks"
        },
        {
          "href": "assets/makehuman-journey-camera-verification.json",
          "label": "Actual rendered synchronization and deformation at six angles"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T11:26:16-03:00",
          "text": "Complete standalone MakeHuman journey next, using the same authorized synthetic six inputs, independent shared styles and explicit fitted-versus-inferred geometry. Native fitting already verified under 10a; fresh processing also checks the added outline diagnostic."
        },
        {
          "date": "2026-09-30T11:39:51-03:00",
          "text": "Browser input acknowledgements timed out even when selection/submission applied. Checked actual state before continuing, preserved the real saved clean-shaven alternative, and closed three completed agent-created comparison tabs. Subsequent semantic actions succeeded. Actual rendering then exposed the beard-placement defect; fixing it before task completion."
        },
        {
          "date": "2026-09-30T11:41:35-03:00",
          "text": "First correction attempt eb421d61 failed on a report field mismatch: semantic correspondences are stored as semanticCorrespondences, not correspondences. Inspected the actual retained export error and fit report, corrected the field, and started a distinct experiment. Failed correction remains retained with no head counted as success."
        },
        {
          "date": "2026-09-30T11:55:01-03:00",
          "text": "Browser control kept timing out on focus/input acknowledgements while actual style selections applied. Reset the tool session, reconnected the same browser, then replaced only the unresponsive agent-created tab. Saved the actually observed corrected fit with keep-current hair and clean-shaven state through the local API before reopening. No other browser or bypass used."
        },
        {
          "date": "2026-09-30T12:15:48-03:00",
          "text": "Visible comparison size mismatch came from a stale canvas frame during a shared scroll zoom, not different head geometry. Immediate camera/edit/resize rendering added; actual front rendered camera positions, targets, FOV and aspect now match exactly."
        },
        {
          "date": "2026-09-30T12:15:48-03:00",
          "text": "Extended native geometry check initially used a 50 mm lower beard envelope, which incorrectly excluded 12 mm full-beard strands. Measured bounds and the actual strand formula justify the corrected 60 mm envelope; upper lip coverage remains 30 mm."
        },
        {
          "date": "2026-09-30T12:20:00-03:00",
          "text": "The expected-selection CLI initially assumed consultations without selections were omitted; the API returns an empty selection record instead. Corrected the check to use its actual version. POST succeeded with HTTP 201; printing a nonexistent response version field failed afterward. Read-back verification confirms the selection was saved, so no POST was repeated."
        },
        {
          "date": "2026-09-30T12:22:19-03:00",
          "text": "Corrected alternative 51de56d0 and edited revision 18ecfdcc are saved with actual 400px browser JPEGs; dedicated consultation a478b9c4 selects the revision with synthetic agreement only. Exact revision reopened, recipe replayed and selection visible. Old examples remain immutable."
        },
        {
          "date": "2026-09-30T12:23:33-03:00",
          "text": "Portable HTTP audit failed because the prior execution-log server had stopped (connection refused). Removed the prematurely added success entry and returned task to in progress; restarting the loopback log server before rerunning the audit."
        }
      ]
    },
    {
      "id": "11",
      "title": "FLAME 2023 Open complete demo verification",
      "depends": [
        "06",
        "11a",
        "16",
        "17"
      ],
      "requirement": "Fit exact commercially usable Open model with compatible fitting code and assets.",
      "criteria": [
        "Exact model access and user license acceptance handled before acquisition; no older noncommercial substitution.",
        "Actual multi-view fitting, texturing, independent styles and complete saved proposal journey.",
        "Code, weights, texture and landmark terms verified separately; failures and inference recorded."
      ],
      "status": "verified",
      "changes": [
        "Exact commercial Open model acquired privately; download account and agreement blocker resolved by user.",
        "Integrated a retained private six-photo UV atlas, native-depth occlusion, best-facing triangle projection, report, six renders and diagnostic 3D comparison into FLAME jobs. No separately restricted FLAME texture model or texture pack is acquired.",
        "Complete native FLAME Open journey verified on all three fictional six-photo cases, with actual processing, independent styles, written and direct edits, saved revisions, selected synthetic expected results and reopening. Separate photo projection experiment is runnable and retained with its unsuitable clean-skin outcome clearly identified."
      ],
      "limitations": [
        "Not implemented or verified.",
        "Projected photo appearance remains unsuitable as clean skin: original hair/beard, camera mismatch, UV seams and lighting remain. Real-person likeness and professionally acceptable hair/beard catalog remain pending; no hidden skin observation claimed.",
        "Actual short01 hair at the quarter angle has visible scalp gaps near the side and ear. The broad catalog compatibility/cleanup task must address these before final customer-demo handoff; this is not treated as professional approval.",
        "Photo projection is unsuitable for clean scalp and facial skin because existing source hair, beard and lighting remain baked in. Neutral fitted geometry remains the editable proposal default. Visible short-hair side coverage gaps require catalog task 15; final professional acceptance and route selection remain pending."
      ],
      "verification": [
        {
          "command": "FLAME2023Open.zip integrity and bundled readme",
          "result": "Archive passed integrity; bundled readme identifies CC-BY-4.0 and links exact model terms. Model loading and multi-view fitting remain pending."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/native-demos/verify-photo-texture.py",
          "result": "PASS three actual photo-texture GLBs: original triangle positions and smooth normals exact, eyes unchanged, model attribution exact, 18 exact source atlas tiles, 18 decoded renders and embedded atlas bytes."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/native-demos/verify-flame-assets.py --texture-version six-photo-projection-v2",
          "result": "PASS 51 actual native GLBs, embedded model attribution, 18 fitted renders, same six input hashes, native basis geometry and corrupted-basis rejection before head publication."
        },
        {
          "command": "Live actual photo projection API checks",
          "result": "PASS private textured GLB, actual atlas and six rendered views decode; each anonymous request denied with 401; unknown view and other candidate paths denied with 404."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/verify-local-photo-texture.py",
          "result": "PASS actual disposable six-photo FLAME fit and atlas, protected derivative requests, source deletion and physical removal of all derived files, concurrent job cancellation, erased-source recreation rejection, and final synthetic permission withdrawal."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/verify-local-candidate-journey.py flame",
          "result": "PASS actual retained fit, independent styles, real written and localized edits, alternative/revision browser pictures, simulated expected selection, workspace persistence, stale 409, atomic invalid refinement 400, anonymous 401 and unlisted 404."
        },
        {
          "command": "Browser exact revision reload",
          "result": "PASS saved native run 28fc78b7, independent short01/goatee, hair 90%/5mm, beard width 90%/brown, one 20mm/3mm stroke and camera replayed; current changes 0, proposed changes 49891. Synthetic expected result version 1 and gallery revision 2 visible; console errors/warnings empty."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; go test -race ./internal/app; npm --prefix web run build",
          "result": "PASS all Go packages, app 1.084 s, race checks 8.847 s, TypeScript/frontend build 2.27 s. Existing 707 kB demo chunk warning retained."
        },
        {
          "command": "Portable log HTTP and image audit",
          "result": "251 linked resources HTTP 200 and byte-identical; 106 raster pictures decoded or SVG documents parsed. An initial overbroad regex incorrectly treated plain-text asset paths as links and received 404; audit corrected to actual picture/output link fields."
        }
      ],
      "pictures": [
        {
          "src": "assets/flame-photo-texture-v1-front.png",
          "caption": "Actual six-photo FLAME texture v1. Existing synthetic hair and beard remain baked onto the fitted surface; seam and faceting defects are visible. Neutral proposal geometry remains separate.",
          "date": "2026-09-30T12:37:55-03:00"
        },
        {
          "src": "assets/flame-photo-texture-browser-2026-09-30.png",
          "caption": "Integrated actual neutral-versus-photo-textured FLAME head at identical rendered cameras. Original hair and beard remain baked in, so the texture is unsuitable as clean skin. Neutral head 112ms/116 initial FPS; textured diagnostic 241ms/132.6 initial FPS in this local sample.",
          "date": "2026-09-30T12:50:27-03:00"
        },
        {
          "src": "assets/flame-photo-texture-v2-front.png",
          "caption": "Native revised projection render preserves smooth native normals. Original styles, imperfect camera alignment, view seams and source lighting remain actual limitations.",
          "date": "2026-09-30T12:50:27-03:00"
        },
        {
          "src": "assets/flame-journey-reopened-2026-09-30.png",
          "caption": "Reopened actual FLAME proposal: identical fitted client head and camera, independent styles, written geometry refinements and a retained local hair stroke. Skin remains neutral; photo-texture failure is evaluated separately.",
          "date": "2026-09-30T12:53:05-03:00"
        },
        {
          "src": "assets/flame-journey-expected-result-2026-09-30.png",
          "caption": "Real saved proposal picture chosen for the fictional FLAME evaluation visit. Earlier candidate selections are preserved; professional assessment and final route selection pending.",
          "date": "2026-09-30T12:53:05-03:00"
        }
      ],
      "commits": [
        "20a2a1166ff40391138d37f0cac310f9d68f0791"
      ],
      "outputs": [
        {
          "href": "assets/flame-open-provenance.json",
          "label": "Pinned model files, hashes and exact terms"
        },
        {
          "href": "assets/flame-photo-texture-v1-report.json",
          "label": "Actual initial projection coverage, input hashes, assumptions and failures"
        },
        {
          "href": "assets/flame-photo-texture-verification.json",
          "label": "Actual native projection, unchanged geometry and photo atlas checks"
        },
        {
          "href": "assets/flame-output-verification-photo-texture.json",
          "label": "Native accepted Open model, attribution and corrupt-basis checks"
        },
        {
          "href": "assets/flame-photo-texture-serving-verification.json",
          "label": "Actual protected derivative requests and decoded outputs"
        },
        {
          "href": "assets/flame-populated-photo-texture-results.json",
          "label": "Actual fitted and texture runs on three fictional clients"
        },
        {
          "href": "assets/flame-photo-texture-live-erasure.json",
          "label": "Actual private derivative erasure, cancellation and no recreation"
        },
        {
          "href": "assets/flame-journey-verification.json",
          "label": "Complete retained synthetic FLAME proposal journey and failure checks"
        },
        {
          "href": "assets/flame-journey-camera-verification.json",
          "label": "Actual six-angle rendered synchronization and deformation"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T23:02:05-03:00",
          "text": "FLAME download prerequisite ready. Candidate task remains pending while shared assets task is active."
        },
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T12:26:15-03:00",
          "text": "Starting FLAME complete journey after the committed MakeHuman milestone. Exact accepted Open weights and native fitter already retained. Discovery ticket 19 explicitly includes evaluating texturing: current clay head does not implement photo texture evaluation, so that requirement remains active before this task can be verified."
        },
        {
          "date": "2026-09-30T12:37:55-03:00",
          "text": "Actual initial FLAME texture run 6d9a67ad completed in 33.369 s, with 7.430 s texture evaluation. Projection assigned 7217 of 7800 skin triangles. Front render shows retained original hair/beard traces, view seams and faceted normals from UV vertex duplication. This is an unsuitable clean-skin texture, not professional acceptance."
        },
        {
          "date": "2026-09-30T12:40:17-03:00",
          "text": "UV islands initially recomputed separate flat normals, producing faceting. Photo projection v2 retains each original native smooth normal exactly while duplicating only UV vertices; v1 outputs stay immutable for failure comparison. Compatibility mode smooth=False preserves the initial projection algorithm for reproducibility."
        },
        {
          "date": "2026-09-30T12:50:27-03:00",
          "text": "Dedicated synthetic FLAME intake creation initially passed the response-only template field and received HTTP 400. Corrected to the input schema and updated its goals and observations for FLAME; no failed request created a consultation."
        },
        {
          "date": "2026-09-30T12:50:27-03:00",
          "text": "Actual proposal stroke first clicked skin and was rejected without changing geometry. A visible hair click then changed 49 additional vertices, preserving the current head and style reference."
        },
        {
          "date": "2026-09-30T12:55:34-03:00",
          "text": "Portable HTTP audit again found the standalone log server stopped. Its prior process exited with SIGTERM (143); no application-side source indicates why. Restarting it in a separate PTY. Portable file paths remain intact; no successful HTTP audit claimed for the failed attempt."
        }
      ]
    },
    {
      "id": "12",
      "title": "Open3D component complete demo verification",
      "depends": [
        "06",
        "12a",
        "16",
        "17"
      ],
      "requirement": "Process and evaluate meshes using Open3D with named reconstruction/fitting dependency.",
      "criteria": [
        "Actual alignment, processing and comparisons with reproducible settings and retained meshes.",
        "Integrated complete viewer/options journey; supporting dependency explicit.",
        "Licenses, metrics and measured/inferred distinctions retained."
      ],
      "status": "verified",
      "changes": [
        "Explicit primary style-version keys prevent supporting jobs from silently reusing the old nose-level MakeHuman beard attachment. New Open3D jobs processed all three corrected native fits; earlier jobs and outputs remain immutable. Verification checks actual primary attachment version and preserves separate report filenames."
      ],
      "limitations": [
        "Not implemented or verified.",
        "Open3D requires an explicitly identified upstream fit, and all hidden surfaces inherit that fitted or inferred geometry. Registration uses a declared synthetic transform, not an independent observed scan. Coarse beard catalog edges need task 15 cleanup; professional judgment and route selection pending."
      ],
      "verification": [
        {
          "command": "populate-components.py open3d --upstream makehuman --attempt visible-lips-v2 --source-style-version makehuman-visible-lips-v2",
          "result": "PASS three actual native CPU jobs completed; preserved corrected primary style assets."
        },
        {
          "command": "verify-components-assets.py --candidate open3d --makehuman-style-version makehuman-visible-lips-v2",
          "result": "PASS 153 GLBs, 54 native renders, nine same-six-photo experiments, exact upstream style copies, native PLY readers, provenance and actual registration/mesh deviation measurements."
        },
        {
          "command": "Browser full Open3D journey and verify-local-candidate-journey.py open3d",
          "result": "PASS keep-current/clean-shaven alternative, written hair length 90% and volume 5mm plus beard width 90% brown, real hair brush with 60 additional vertices, six equal actual rendered camera transforms, revision 3, separate synthetic expected consultation, reload and actual pictures. Current unchanged; proposed hair 2930 and beard 124679 vertices changed. Invalid mixed written commands rejected atomically, stale workspace 409, anonymous 401, unlisted native style 404."
        },
        {
          "command": "go test ./... and npm --prefix web run build",
          "result": "PASS via mise Go 1.26.0, packages cached. Build 1.67s; existing 707.14kB bundle warning retained."
        },
        {
          "command": "Browser reopened render and console",
          "result": "PASS actual native current 227011 triangles/13.3MB/448ms/108.7 initial FPS and proposed 104573 triangles/7.1MB/279ms/108.7 initial FPS; console errors empty. Reopened independent meshes, recipe, camera and synthetic expected selection version 1."
        },
        {
          "command": "Corrected MakeHuman upstream resources",
          "result": "Alex 3.582s/143408429 bytes/0.409mm max deviation/4 ICP iterations; Maya 3.460s/141514522 bytes/0.348mm/4; Noah 3.444s/139694652 bytes/0.363mm/5. Deviations compare fitted template surfaces, not actual people."
        },
        {
          "command": "verify-execution-log.py",
          "result": "PASS 257 actual relative resources HTTP 200 and byte-identical, 108 decoded pictures; one implementation task active. New comparison picture already decoded separately."
        }
      ],
      "pictures": [
        {
          "src": "assets/open3d-journey-reopened-2026-09-30.png",
          "caption": "Actual edited Open3D output reopened at a common three-quarter camera. Primary dependency is the corrected MakeHuman fit. Coarse goatee edges remain catalog cleanup work; hidden surfaces are inferred.",
          "date": "2026-09-30T13:15:11-03:00"
        },
        {
          "src": "assets/open3d-journey-expected-result-2026-09-30.png",
          "caption": "Separate synthetic Open3D expected choice preserves earlier FLAME, MakeHuman and MPFB choices. This recorded simulation does not constitute professional acceptance.",
          "date": "2026-09-30T13:15:11-03:00"
        },
        {
          "src": "assets/open3d-three-upstream-comparison-makehuman-visible-lips-v2.png",
          "caption": "Actual neutral upstream fits above and Open3D processed geometry below. The same synthetic six views inform each fit; no independent scan is supplied. Native conversion and smoothing differences remain visible.",
          "date": "2026-09-30T13:16:02-03:00"
        }
      ],
      "commits": [
        "f7aa09abbca39fc352bf178c48bd0a26fbd82960"
      ],
      "outputs": [
        {
          "href": "assets/open3d-journey-camera-verification.json",
          "label": "Actual six rendered cameras and vertex edit measurements"
        },
        {
          "href": "assets/open3d-journey-verification.json",
          "label": "Actual persisted native artifacts, browser pictures, revisions, expected result and failure behavior"
        },
        {
          "href": "assets/open3d-makehuman-populated-results-makehuman-visible-lips-v2.json",
          "label": "Three corrected upstream native component runs"
        },
        {
          "href": "assets/open3d-output-verification-makehuman-visible-lips-v2.json",
          "label": "Actual nine experiments, exact independent assets and native measurements"
        },
        {
          "href": "assets/open3d-provenance.json",
          "label": "Exact Open3D CPU and dependency license provenance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T13:06:33-03:00",
          "text": "Begin complete Open3D supporting journey using identified real six-photo native fitting, corrected MakeHuman visible-lip style attachment, independent styles, editing, saved alternatives, expected selection and reopening. Historical component jobs remain retained."
        },
        {
          "date": "2026-09-30T13:15:11-03:00",
          "text": "An ambiguous keep-current button locator failed before mutation; scoped to the hairstyle region. Two natural-language requests were rejected atomically before the supported explicit recipe. Ambiguous expected-panel heading locator failed before capture; exact synthetic consultation heading used."
        }
      ]
    },
    {
      "id": "13",
      "title": "MeshLab / PyMeshLab component complete demo verification",
      "depends": [
        "06",
        "13a",
        "16",
        "17"
      ],
      "requirement": "Clean, repair, simplify and export shared meshes with named upstream route.",
      "criteria": [
        "Repeatable actual filter pipeline and fidelity/clipping/output-size comparisons.",
        "Integrated saved comparison journey; not labeled standalone photo reconstruction.",
        "Software/assets licenses and complete setup/processing effort recorded."
      ],
      "status": "verified",
      "changes": [
        "Completed native MeshLab processing of all three corrected MakeHuman primary fits, preserving the earlier experiments. Full browser journey saved independent keep-current/clean-shaven alternative, bounded written recipe, direct hair edit, six equal rendered cameras, immutable revision 3, consultation-specific synthetic expected result and exact reopening.",
        "Fixed native diagnostic setting strings causing horizontal overflow. Job text now wraps, preserving readable filter parameters. Browser verified document width equals client width after reload; original failed layout picture retained."
      ],
      "limitations": [
        "Not implemented or verified.",
        "MeshLab remains an explicitly dependent supporting processor. No observed scan, raw-photo reconstruction or new anatomical detail is claimed. Sampled distances can miss local errors. Coarse shared beard geometry needs task 15 cleanup, and professional assessment is pending."
      ],
      "verification": [
        {
          "command": "populate-components.py meshlab --upstream makehuman --attempt visible-lips-v2 --source-style-version makehuman-visible-lips-v2",
          "result": "PASS actual Alex/Maya/Noah CPU jobs completed. Alex 4.038s/142673195 bytes/0.267mm maximum surface deviation; Maya 3.420s/140782800 bytes/0.225mm; Noah 3.351s/138961107 bytes/0.257mm. Distances are against upstream fitted geometry, not actual people."
        },
        {
          "command": "verify-components-assets.py --candidate meshlab --makehuman-style-version makehuman-visible-lips-v2",
          "result": "PASS actual 153 GLBs, 54 native renders, nine same-six-photo snapshots, exact unchanged independent styles, native PLY round trips, real repair/simplification filters, sampled distances and provenance. Artificial topology fixture proves non-manifold repair without deleting valid faces, separate from client geometry."
        },
        {
          "command": "Browser full journey and verify-local-candidate-journey.py meshlab",
          "result": "PASS five actual native assets, anonymous 401, two actual JPEG browser pictures, immutable lineage, simulated expected selection version 1, workspace persistence, stale 409, unsupported mixed request atomic 400 and unlisted style 404. First direct stroke missed and left no change; successful visible hair hit retained one stroke, followed by all six matching cameras."
        },
        {
          "command": "go test ./... and npm --prefix web run build",
          "result": "PASS mise Go 1.26.0 packages cached; final build 1.57s after CSS correction, existing 707.14kB warning."
        },
        {
          "command": "Final browser reload, layout and resource measurements",
          "result": "PASS page/client width both 1265px at viewport 1280px. Current 227010 triangles/13.3MB/480ms/115.6 initial FPS; proposed 104572 triangles/7.1MB/306ms/115.6 initial FPS. One console rejection comes from the unrelated QuillBot browser extension, not Trama source; retained as a browser-environment limitation."
        },
        {
          "command": "verify-execution-log.py",
          "result": "PASS 267 actual linked resources HTTP 200 and byte-identical, 113 pictures decoded or XML-parsed, one active task."
        }
      ],
      "pictures": [
        {
          "src": "assets/meshlab-journey-reopened-2026-09-30.png",
          "caption": "Actual reopened independent styles and edits. Intermediate horizontal overflow visible; fixed and reverified in the later picture.",
          "date": "2026-09-30T13:23:58-03:00"
        },
        {
          "src": "assets/meshlab-journey-layout-fixed-2026-09-30.png",
          "caption": "Final loaded synchronized MeshLab current/proposed views after wrapping long native parameters. Same synthetic fitting dependency, neutral head, real independent styles and saved recipe.",
          "date": "2026-09-30T13:23:58-03:00"
        },
        {
          "src": "assets/meshlab-journey-expected-result-2026-09-30.png",
          "caption": "Simulated expected MeshLab choice retains separate Open3D and earlier candidate selections. Professional acceptance and route selection remain pending.",
          "date": "2026-09-30T13:23:58-03:00"
        },
        {
          "src": "assets/meshlab-three-upstream-comparison-makehuman-visible-lips-v2.png",
          "caption": "Actual neutral upstream fitted heads above and native MeshLab processed heads below, using the same six fictional inputs.",
          "date": "2026-09-30T13:23:58-03:00"
        }
      ],
      "commits": [
        "4740728b5395c6d335ae14aa2f5911f7007d1685"
      ],
      "outputs": [
        {
          "href": "assets/meshlab-journey-camera-verification.json",
          "label": "Actual all-angle rendered camera and direct editing checks"
        },
        {
          "href": "assets/meshlab-journey-verification.json",
          "label": "Actual persisted native journey and failure checks"
        },
        {
          "href": "assets/meshlab-makehuman-populated-results-makehuman-visible-lips-v2.json",
          "label": "Three actual corrected upstream experiments and resources"
        },
        {
          "href": "assets/meshlab-output-verification-makehuman-visible-lips-v2.json",
          "label": "Actual nine supporting experiments and independent assets"
        },
        {
          "href": "assets/meshlab-native-filter-fixture-makehuman-visible-lips-v2.json",
          "label": "Real native filters on an explicit artificial topology diagnostic"
        },
        {
          "href": "assets/meshlab-provenance.json",
          "label": "Exact software and dependency license provenance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T13:16:17-03:00",
          "text": "Begin complete MeshLab / PyMeshLab supporting journey with real native processing of corrected MakeHuman primary fits. All earlier experiments retained, upstream reconstruction/fitting dependency explicit."
        },
        {
          "date": "2026-09-30T13:23:58-03:00",
          "text": "Expected panel locator was scoped to its exact synthetic consultation after ambiguity. Preserved historical artificial filter fixture; new verification writes a version-specific fixture rather than replacing earlier evidence."
        }
      ]
    },
    {
      "id": "14",
      "title": "CloudCompare component complete demo verification",
      "depends": [
        "06",
        "14a",
        "16",
        "17"
      ],
      "requirement": "Align and compare shared outputs with named upstream reconstruction/fitting route.",
      "criteria": [
        "Actual repeatable registration and distances with retained diagnostic outputs.",
        "Integrated workflow through expected selection/reopen; shared upstream dependency explicit.",
        "Agreement between inferred meshes never presented as ground truth; licenses/resources recorded."
      ],
      "status": "verified",
      "changes": [
        "Completed native CloudCompare experiments on all three corrected MakeHuman primary fits with MPFB as a distinct comparison reference. Preserved original jobs; exact unchanged styles survive native conversion. Actual browser workflow saves keep-current/clean-shaven alternative, written and direct refinements, immutable revision 3, synthetic expected choice and exact reopened work."
      ],
      "limitations": [
        "Not implemented or verified.",
        "CloudCompare is explicitly dependent on the primary fitting route and optional separately identified fitted reference. Random native sampling is not seeded, so exact diagnostics can vary; same geometry still round-trips unchanged. No independent scan or accuracy proof. Shared beard outline cleanup remains task 15 and professional assessment pending."
      ],
      "verification": [
        {
          "command": "populate-components.py cloudcompare --upstream makehuman --reference blender-mpfb --attempt visible-lips-v2 --source-style-version makehuman-visible-lips-v2",
          "result": "PASS three real native jobs. Alex 7.112s/238327884 bytes, C2M mean 2.642 to 0.509mm/max 8.791mm; Maya 6.995s/235245601 bytes, 2.970 to 0.137mm/max 10.645mm; Noah 7.067s/231748491 bytes, 2.987 to 0.340mm/max 10.740mm. Alignment compares inferred fitted geometry; preview retains primary head."
        },
        {
          "command": "verify-components-assets.py --candidate cloudcompare --makehuman-style-version makehuman-visible-lips-v2",
          "result": "PASS 153 actual GLBs, 54 native renders, nine same-six-photo snapshots, 45 PLY files including fitted comparison outputs reopened through actual native CloudCompare, exact style copies, conversion coordinates unchanged, native registration iterations, scalar distances and two-route provenance."
        },
        {
          "command": "Browser journey and verify-local-candidate-journey.py cloudcompare",
          "result": "PASS real independent native assets, keep-current/clean-shaven alternative and actual JPEGs, written 90% hair length/5mm volume/90% brown beard width, one real 20mm/3mm brush stroke, six matching rendered cameras, revision 3 and separate simulated expected consultation version 1. Reload retains meshes, edits, camera and history. Anonymous 401, stale 409, unsupported mixed request atomic 400 and unlisted native style 404."
        },
        {
          "command": "go test ./... and npm --prefix web run build",
          "result": "PASS mise Go 1.26.0 cached packages; build 1.68s, existing 707.14kB bundle warning."
        },
        {
          "command": "Reopened browser rendering and environment",
          "result": "Current 229416 triangles/13.4MB/468ms/126.3 initial FPS; proposed 106978 triangles/7.1MB/310ms/126.3 initial FPS. Actual rendered transforms match at saved three-quarter angle. Same earlier QuillBot extension rejection remains in browser log; no new Trama source error observed."
        },
        {
          "command": "verify-execution-log.py",
          "result": "PASS 274 linked local resources HTTP 200 and byte-identical, 116 pictures decoded or parsed, one active task."
        }
      ],
      "pictures": [
        {
          "src": "assets/cloudcompare-journey-reopened-2026-09-30.png",
          "caption": "Actual saved CloudCompare result reopened with independent current/proposed styles and retained edits, same three-quarter camera, resource measurements. Primary is corrected MakeHuman; separate MPFB reference changes diagnostic evidence, not this preview.",
          "date": "2026-09-30T13:30:56-03:00"
        },
        {
          "src": "assets/cloudcompare-journey-expected-result-2026-09-30.png",
          "caption": "Consultation-specific simulated CloudCompare expected choice preserves earlier route history. Real professional acceptance and final choice remain pending.",
          "date": "2026-09-30T13:30:56-03:00"
        },
        {
          "src": "assets/cloudcompare-three-upstream-comparison-makehuman-visible-lips-v2.png",
          "caption": "Actual original upstream fits above and CloudCompare native converted heads below. Unchanged primary geometry and different fitted templates are visible, with no ground-truth scan claim.",
          "date": "2026-09-30T13:30:56-03:00"
        }
      ],
      "commits": [
        "fb776abb8f830d5900f691a15c5e03410da43e31"
      ],
      "outputs": [
        {
          "href": "assets/cloudcompare-journey-camera-verification.json",
          "label": "Actual six rendered cameras and vertex edits"
        },
        {
          "href": "assets/cloudcompare-journey-verification.json",
          "label": "Actual persisted native artifacts, browser pictures, expected choice and failure checks"
        },
        {
          "href": "assets/cloudcompare-makehuman-populated-results-makehuman-visible-lips-v2.json",
          "label": "Three corrected primary fits and separate reference experiments"
        },
        {
          "href": "assets/cloudcompare-output-verification-makehuman-visible-lips-v2.json",
          "label": "Native readers, real traces, same inputs and independent styles across nine experiments"
        },
        {
          "href": "assets/cloudcompare-provenance.json",
          "label": "Exact software, build, bundled dependency and change notices"
        },
        {
          "href": "assets/cloudcompare-live-verification.json",
          "label": "Prior actual reference-only deletion, concurrent cancellation, private access and no recreation evidence, still applicable unchanged privacy code"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        },
        {
          "date": "2026-09-30T13:24:39-03:00",
          "text": "Begin complete CloudCompare supporting journey on corrected MakeHuman primary fits with independent MPFB comparison reference. Real native processing, separate primary/reference provenance, shared style edits, saved history and exact reopening required."
        },
        {
          "date": "2026-09-30T13:30:56-03:00",
          "text": "An incorrect optional-reference locator failed read-only; exact visible control name used. Initial alternative save blocked until actual meshes loaded, without placeholder success. Both primary and reference remain live transitive dependencies."
        }
      ]
    },
    {
      "id": "15",
      "title": "Ample independent catalogs and added references",
      "depends": [
        "05",
        "07",
        "10",
        "11",
        "12",
        "13",
        "14",
        "16",
        "17"
      ],
      "requirement": "Expand toward roughly 40 hairstyles and 20 beardstyles, with professional-added references.",
      "criteria": [
        "Varied real reusable styles across length/texture/volume/silhouette/maintenance, independent catalogs and filters.",
        "Consistent renders and visible structured license provenance; professional import works privately.",
        "Assets load, render, combine, save/reopen across viable routes; incompatibilities recorded; professional review pending."
      ],
      "status": "verified",
      "changes": [
        "Creating original CC0 dedicated geometry on the actual neutral skin, with 40 distinct hairstyle recipes across straight/wavy/curly/coily families and 20 beard coverage recipes. Continuous scalp mesh and separate solid strands address sparse coverage; curved lip/cheek boundaries replace rectangular masks for new assets. Existing 16 identifiers and meshes remain untouched.",
        "Added immutable per-job catalog snapshots and actual retained-style checks for serving, component copies, and saved options. Catalog expansion preserves older fitted jobs and historical proposals; unexported styles are rejected.",
        "Created and decoded 40 original CC0 reusable hairstyle meshes and 20 beardstyle meshes, with 240 actual matched mannequin renders. Published private catalog preserves all 11 earlier hair and 5 earlier beard assets and marks them historical rather than replacing their geometry.",
        "Added private professional reference records: authorized client media, existing real 3D style, creator, licensed source, reuse-rights affirmation and observations. References stay within their client journey to honor the existing permission notice; source erasure and withdrawal cascade to them.",
        "Completed browser save/reopen checks for all six viable native routes with the new wavy quiff and boxed beard. Real retained pictures and bounded written edits accompany immutable revisions. MakeHuman also retains an actual direct brush stroke and synthetic expected-result revision history. Client-scoped professional references use existing reusable 3D styles and never imply photo reconstruction."
      ],
      "limitations": [
        "Not implemented or verified.",
        "COLMAP failed the standard six-photo experiment and Meshroom native runtime remains blocked on CUDA terms. These are evidence and compatibility limitations, not real prerequisites for producing shared commercially usable assets for the viable fitting interfaces. Neither route is removed or relabeled successful.",
        "New catalog remains private staging. Native export compatibility, actual browser reloads, all 40 hairstyle and 20 beardstyle assets, and professional-added reference workflow are not yet verified.",
        "Catalog technical creation verified; full native fitting compatibility and actual browser save/reopen of expanded styles remain pending. Assets are stylized geometric proposals, not photorealistic haircut predictions. Professional feasibility and aesthetic acceptance remain pending.",
        "The first browser performance sample was captured while the IAB surface was hidden, although document.hidden was false. Its 1.9 FPS and 35.5/10.2-second load samples are retained; the earlier foreground caption was inaccurate. A visibly presented reload is required before reporting foreground performance.",
        "Assets are stylized procedural surfaces with simple materials. Synthetic cases cannot establish real client likeness, haircut outcomes, texture realism or professional suitability. Published geometry is immutable; later mesh corrections require a new version. COLMAP failed six-photo reconstruction and Meshroom remains blocked by CUDA terms; neither is presented as successful catalog reconstruction."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./internal/app",
          "result": "Initial failure exposed a test fixture that overwrote its retained style manifest; repaired that fixture. Final result passed in 1.197s, including preservation and unexported-style rejection."
        },
        {
          "command": "npm --prefix web run build",
          "result": "Passed in 1.57s. Existing large demo chunk warning remains (708.45 kB before gzip)."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/demo-assets/expand-catalog.py",
          "result": "Actual full generation completed: 547.376s wall time, peak RSS 852736 KiB, retained staged outputs 91210563 bytes. 40 hair and 20 beard meshes; 4 actual native renders per style."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/demo-assets/publish-catalog.py",
          "result": "Passed: decoded all 60 actual GLBs, finite vertices, indexed topology, exact recorded mesh counts and SHA256; all 240 actual renders decoded with matching checksums. Earlier geometry bytes preserved."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "Passed: cmd/api 0.007s, internal/app 1.070s. Private reference tests cover affirmative rights, licensed source, unsafe URL, studio isolation, source erasure, withdrawal and denied recreation."
        },
        {
          "command": "npm --prefix web run build (latest localization pass)",
          "result": "Initial failure: duplicate pre-existing Choose an image translation. Removed duplicate and rebuilding; final result pending."
        },
        {
          "command": "npm --prefix web run build (localization and references)",
          "result": "Passed after removing the duplicate translation: 1.45s. Demo chunk 714.17 kB before gzip; warning retained."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/verify-execution-log.py",
          "result": "Passed: 288 relative linked resources returned HTTP 200 and exact bytes; 127 pictures decoded; only task 15 active."
        },
        {
          "command": "Native catalog fitting: MakeHuman / six shared synthetic photos per case",
          "result": "All 3 real jobs completed with immutable 51-hair/25-beard snapshots. Alex 17.174s / 153279477 bytes; Maya 16.251s / 151970227 bytes; Noah 16.710s / 149803202 bytes. Native geometry compatibility still requires complete decoded inspection and browser reopen."
        },
        {
          "command": "In-app browser recovery",
          "result": "Initial tab 10 Runtime.evaluate timeout, fresh tab 11 focus timeout and no-match label failure; accessibility showed actions eventually applied. Closed stale agent tab 10, then semantic DOM read resumed. Native role-based texture filter successfully selected wavy. Screenshot/action verification remains in progress."
        },
        {
          "command": "MakeHuman expanded catalog decoded inspection",
          "result": "Passed: all 76 actual native style GLBs decoded per case (228 total), bounded metre coordinates, finite geometry, unit normals and triangle indices; four actual representative views rendered for each fictional case."
        },
        {
          "command": "FLAME and Blender + MPFB expanded catalog processing",
          "result": "All 3 cases per route completed with 51-hair/25-beard immutable exports. FLAME 32.234-32.712s, Blender 53.151-54.155s. Actual native geometry matrix inspection is now running sequentially."
        },
        {
          "command": "native-demos/catalog-matrix.py plus resumed CloudCompare FLAME population and verification",
          "result": "36 completed real native runs across 3 fictional cases: 3 fitters plus 3 supporting components with each fitter; all 76 retained styles decoded per run with finite metre-scale geometry, valid indices and unit normals; four actual representative native renders per case. Initial HTTP 429 retained; final combination resumed without weakening login protections."
        },
        {
          "command": "node --experimental-strip-types scripts/verify-proposal-edits.mjs --expanded-catalog",
          "result": "PASS: exact application deformation on 1368 actual native style GLBs from 18 jobs. Independent written recipes, actual localized strokes, protected roots, 25mm cap, deterministic replay, exact reset and immutable heads/source files."
        },
        {
          "command": "local_demo_http.py session reuse",
          "result": "PASS /me remains demo@trama.local, reusable cookie stored privately with 0600 mode; script requests remain loopback only."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./...",
          "result": "PASS cmd/api 1.034s, internal/app 9.794s. Meaningful studio/source/withdrawal/nonrecreation and immutable job catalog tests included."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; npm --prefix web run build",
          "result": "PASS in the task 15 implementation checks: cmd/api 0.007s, internal/app 1.070s; Vite build 1.45s. Existing large chunk warning retained (714.17kB demo bundle). No source changes after the successful build."
        },
        {
          "command": ".scratch/private/native-demos/python/bin/python scripts/verify-local-catalog.py",
          "result": "PASS 60 actual new catalog GLBs and 240 decoded four-angle renders served by the app, complete provenance; six actual browser revision pictures and native styles; anonymous access denied; two private original references; synthetic MakeHuman selected version 2 preserves its prior event."
        },
        {
          "command": "scripts/verify-execution-log.py",
          "result": "PASS 360 actual linked local resources HTTP 200 with exact byte equality; 171 pictures decoded; at most one task active."
        }
      ],
      "pictures": [
        {
          "src": "assets/catalog-buzz-ear-coverage-failed.png",
          "caption": "Failed intermediate original buzz geometry: scalp sampling incorrectly extended over the ear. This actual rendered defect prevents catalog publication; later mask correction must pass visual review.",
          "date": "2026-09-30T13:44:02-03:00"
        },
        {
          "src": "assets/catalog-long-face-coverage-intermediate.png",
          "caption": "Intermediate real eight-style render check: long front strands covered the face and rear coverage was thin. Retained as failed visual evidence; short front guides and thicker strand groups are being evaluated.",
          "date": "2026-09-30T14:07:56-03:00"
        },
        {
          "src": "assets/catalog-representative-renders.png",
          "caption": "Current representative original 3D assets rendered from four actual mannequin angles. Iteration still in progress; native fitted compatibility and professional acceptance remain pending.",
          "date": "2026-09-30T14:07:56-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-01.png",
          "caption": "Full original 3D asset library, group 1/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:35-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-02.png",
          "caption": "Full original 3D asset library, group 2/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:35-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-03.png",
          "caption": "Full original 3D asset library, group 3/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:35-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-04.png",
          "caption": "Full original 3D asset library, group 4/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:35-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-05.png",
          "caption": "Full original 3D asset library, group 5/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:35-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-06.png",
          "caption": "Full original 3D asset library, group 6/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:35-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-07.png",
          "caption": "Full original 3D asset library, group 7/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:36-03:00"
        },
        {
          "src": "assets/catalog-mannequin-set-08.png",
          "caption": "Full original 3D asset library, group 8/8. Four actual mannequin angles per asset; approximate geometric styling and professional acceptance pending.",
          "date": "2026-09-30T14:22:36-03:00"
        },
        {
          "src": "assets/catalog-makehuman-browser-initial.png",
          "caption": "Actual new MakeHuman fitted-head comparison: independently selected wavy quiff and short boxed beard. Initial measured load 35.464s current / 10.186s proposed, both 1.9 foreground FPS. Retained as slow browser evidence, not a passed performance claim.",
          "date": "2026-09-30T14:36:12-03:00"
        },
        {
          "src": "assets/catalog-makehuman-browser-reopened.png",
          "caption": "Foreground IAB after reload: independent native wavy quiff and boxed beard; actual written changes and retained localized stroke. 133.9 initial FPS; current 13.4MB/17935ms and proposed 4.0MB/8748ms. Synthetic fitted/inferred geometry, stylized assets and achievable style suitability await professional review.",
          "date": "2026-09-30T14:58:20-03:00"
        },
        {
          "src": "assets/catalog-professional-references-browser.png",
          "caption": "Two original locally generated mannequin references uploaded through the actual client UI, retained privately with creator, rights and observations; independent hair/beard associations survived reload.",
          "date": "2026-09-30T14:58:20-03:00"
        },
        {
          "src": "assets/blender-mpfb-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: blender-mpfb-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/blender-mpfb-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: blender-mpfb-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/blender-mpfb-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: blender-mpfb-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-blender-mpfb-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-blender-mpfb-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-blender-mpfb-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-blender-mpfb-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-blender-mpfb-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-blender-mpfb-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-flame-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-flame-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-flame-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-flame-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-flame-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-flame-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-makehuman-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-makehuman-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-makehuman-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-makehuman-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/cloudcompare-makehuman-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: cloudcompare-makehuman-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/flame-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: flame-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/flame-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: flame-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/flame-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: flame-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/makehuman-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: makehuman-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/makehuman-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: makehuman-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/makehuman-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: makehuman-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-blender-mpfb-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-blender-mpfb-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-blender-mpfb-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-blender-mpfb-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-blender-mpfb-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-blender-mpfb-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-flame-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-flame-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-flame-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-flame-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-flame-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-flame-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-makehuman-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-makehuman-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-makehuman-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-makehuman-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/meshlab-makehuman-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: meshlab-makehuman-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-blender-mpfb-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-blender-mpfb-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-blender-mpfb-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-blender-mpfb-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-blender-mpfb-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-blender-mpfb-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-flame-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-flame-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-flame-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-flame-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-flame-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-flame-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-makehuman-catalog-alex-ramos.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-makehuman-catalog-alex-ramos. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-makehuman-catalog-maya-costa.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-makehuman-catalog-maya-costa. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/open3d-makehuman-catalog-noah-kim.png",
          "caption": "Actual native four-angle renders with the new independently fitted representative hair and beard: open3d-makehuman-catalog-noah-kim. Synthetic inputs; fitted/inferred head, not reconstruction accuracy or actual outcome. Professional suitability pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/catalog-mpfb-browser.png",
          "caption": "Actual mpfb browser rendering of newly generated independent styles on its retained native head. Saved edited revision and workspace reopened; supporting components explicitly depend on MakeHuman fitting. Synthetic example, professional review pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/catalog-flame-browser.png",
          "caption": "Actual flame browser rendering of newly generated independent styles on its retained native head. Saved edited revision and workspace reopened; supporting components explicitly depend on MakeHuman fitting. Synthetic example, professional review pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/catalog-open3d-browser.png",
          "caption": "Actual open3d browser rendering of newly generated independent styles on its retained native head. Saved edited revision and workspace reopened; supporting components explicitly depend on MakeHuman fitting. Synthetic example, professional review pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/catalog-meshlab-browser.png",
          "caption": "Actual meshlab browser rendering of newly generated independent styles on its retained native head. Saved edited revision and workspace reopened; supporting components explicitly depend on MakeHuman fitting. Synthetic example, professional review pending.",
          "date": "2026-09-30T15:05:18-03:00"
        },
        {
          "src": "assets/catalog-cloudcompare-browser.png",
          "caption": "Actual cloudcompare browser rendering of newly generated independent styles on its retained native head. Saved edited revision and workspace reopened; supporting components explicitly depend on MakeHuman fitting. Synthetic example, professional review pending.",
          "date": "2026-09-30T15:05:18-03:00"
        }
      ],
      "commits": [
        "77091627ceed1138f39f98c6fb94a4ee4ae7b762"
      ],
      "outputs": [
        {
          "href": "assets/catalog-expansion-representative.json",
          "label": "Actual representative mesh measurements and structured CC0 provenance"
        },
        {
          "href": "assets/catalog-expansion-creation.json",
          "label": "Complete real asset creation measurements, recipes and license provenance"
        },
        {
          "href": "assets/catalog-publication-verification.json",
          "label": "Decoded full catalog and preservation verification"
        },
        {
          "href": "assets/makehuman-populated-trama-surface-styles-v1.json",
          "label": "Actual expanded-catalog MakeHuman jobs for three fictional cases"
        },
        {
          "href": "assets/makehuman-expanded-catalog-verification.json",
          "label": "Actual complete native MakeHuman mesh inspection and representative renders"
        },
        {
          "href": "assets/flame-populated-trama-surface-styles-v1.json",
          "label": "Actual expanded-catalog FLAME jobs for three fictional cases"
        },
        {
          "href": "assets/blender-mpfb-populated-trama-surface-styles-v1.json",
          "label": "Actual expanded-catalog MPFB jobs for three fictional cases"
        },
        {
          "href": "assets/catalog-browser-verification.json",
          "label": "Actual browser camera, deformation, reload, references and performance evidence"
        },
        {
          "href": "assets/editing-expanded-catalog-verification.json",
          "label": "Exact application edit checks on 1368 actual expanded native meshes"
        },
        {
          "href": "assets/blender-mpfb-expanded-catalog-verification.json",
          "label": "blender mpfb expanded catalog verification"
        },
        {
          "href": "assets/cloudcompare-blender-mpfb-expanded-catalog-verification.json",
          "label": "cloudcompare blender mpfb expanded catalog verification"
        },
        {
          "href": "assets/cloudcompare-flame-expanded-catalog-verification.json",
          "label": "cloudcompare flame expanded catalog verification"
        },
        {
          "href": "assets/cloudcompare-makehuman-expanded-catalog-verification.json",
          "label": "cloudcompare makehuman expanded catalog verification"
        },
        {
          "href": "assets/flame-expanded-catalog-verification.json",
          "label": "flame expanded catalog verification"
        },
        {
          "href": "assets/meshlab-blender-mpfb-expanded-catalog-verification.json",
          "label": "meshlab blender mpfb expanded catalog verification"
        },
        {
          "href": "assets/meshlab-flame-expanded-catalog-verification.json",
          "label": "meshlab flame expanded catalog verification"
        },
        {
          "href": "assets/meshlab-makehuman-expanded-catalog-verification.json",
          "label": "meshlab makehuman expanded catalog verification"
        },
        {
          "href": "assets/open3d-blender-mpfb-expanded-catalog-verification.json",
          "label": "open3d blender mpfb expanded catalog verification"
        },
        {
          "href": "assets/open3d-flame-expanded-catalog-verification.json",
          "label": "open3d flame expanded catalog verification"
        },
        {
          "href": "assets/open3d-makehuman-expanded-catalog-verification.json",
          "label": "open3d makehuman expanded catalog verification"
        },
        {
          "href": "assets/cloudcompare-blender-mpfb-populated-results-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: cloudcompare-blender-mpfb-populated-results-trama-surface-styles-v1"
        },
        {
          "href": "assets/cloudcompare-flame-populated-results-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: cloudcompare-flame-populated-results-trama-surface-styles-v1"
        },
        {
          "href": "assets/cloudcompare-makehuman-populated-results-makehuman-visible-lips-v2-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: cloudcompare-makehuman-populated-results-makehuman-visible-lips-v2-trama-surface-styles-v1"
        },
        {
          "href": "assets/meshlab-blender-mpfb-populated-results-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: meshlab-blender-mpfb-populated-results-trama-surface-styles-v1"
        },
        {
          "href": "assets/meshlab-flame-populated-results-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: meshlab-flame-populated-results-trama-surface-styles-v1"
        },
        {
          "href": "assets/meshlab-makehuman-populated-results-makehuman-visible-lips-v2-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: meshlab-makehuman-populated-results-makehuman-visible-lips-v2-trama-surface-styles-v1"
        },
        {
          "href": "assets/open3d-blender-mpfb-populated-results-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: open3d-blender-mpfb-populated-results-trama-surface-styles-v1"
        },
        {
          "href": "assets/open3d-flame-populated-results-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: open3d-flame-populated-results-trama-surface-styles-v1"
        },
        {
          "href": "assets/open3d-makehuman-populated-results-makehuman-visible-lips-v2-trama-surface-styles-v1.json",
          "label": "Actual expanded native runs: open3d-makehuman-populated-results-makehuman-visible-lips-v2-trama-surface-styles-v1"
        },
        {
          "href": "assets/catalog-live-workflow-verification.json",
          "label": "catalog live workflow verification"
        },
        {
          "href": "assets/catalog-route-browser-verification.json",
          "label": "catalog route browser verification"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T13:31:40-03:00",
          "text": "Begin ample separate catalogs and professional-added references. Use actual shared native fitting interfaces, preserve earlier option asset geometry and versions, create reusable original varied assets with structured provenance, and verify all viable routes. Correct scalp gaps and coarse beard outlines as implementation defects before professional review."
        },
        {
          "date": "2026-09-30T13:41:38-03:00",
          "text": "Initial private representative generator stopped before creation because the texture extraction cache directory had not been created. Added cache creation and reran. New assets remain in a staging directory until actual render and compatibility checks pass."
        },
        {
          "date": "2026-09-30T13:44:02-03:00",
          "text": "Stopped the first representative generation after real renders exposed ear coverage. Earlier three heavy hairstyles had 119552-186488 triangles and 18.6-33.4s rendering effort each. Corrected continuous forehead/temple/nape boundary with explicit outer-ear exclusion and sampled one third of deterministic roots; new generation follows."
        },
        {
          "date": "2026-09-30T14:50:13-03:00",
          "text": "Catalog matrix stopped before the final CloudCompare/FLAME combination: eight sequential successful verification logins exhausted the real 8-per-10-minute local login limit (HTTP 429). No native failure or fallback was claimed. Private loopback verification session reuse now checks the mandated demo account identity; authentication protections remain intact."
        },
        {
          "date": "2026-09-30T15:06:46-03:00",
          "text": "Technical catalog milestone verified locally. All six viable route browser examples retain new independent styles and edited pictures; the 36-run native matrix and 1368 exact edit checks passed. Professional acceptance and final candidate selection remain explicitly pending."
        }
      ]
    },
    {
      "id": "18",
      "title": "Actual outcomes and follow-up comparisons",
      "depends": [
        "04",
        "17"
      ],
      "requirement": "Post-cut uploads, follow-up visits and baseline/expected/actual comparisons.",
      "criteria": [
        "New visits append rather than overwrite photos or chosen results.",
        "Matching views compare all three states with honest missing angle handling.",
        "Service notes, client feedback and synthetic/simulated outcome labels persisted."
      ],
      "status": "verified",
      "changes": [
        "Implementation defaults: immutable visit records with an explicit post-cut or follow-up type, date, notes and client feedback; retained baseline/actual view assignments; selected expected option and selection event captured at visit creation. Incomplete views remain visible. Synthetic demo visits are labeled and never treated as actual haircut evidence.",
        "Implemented immutable post-cut and follow-up records with linked earlier visits, consultation-specific expected selection snapshots, independently retained baseline/actual view assignments, synthetic labeling and explicit actual-photo confirmation.",
        "Added the local three-column comparison with eight named angles, the actual retained edited native 3D proposal, fixed rotation, explicit zoom and reset, clear missing-media states and visit history.",
        "Populated and reopened six positive simulated visits across Alex, Maya and Noah using their original private fictional sources and real saved native proposals; retained the initial incorrect date-entry example as intermediate failure evidence."
      ],
      "limitations": [
        "Not implemented or verified.",
        "All populated outcomes are explicitly simulated. Retrospective dates do not establish historical client agreement; the selected expected version is captured when the visit is recorded. Real haircut outcomes and professional acceptance require user review.",
        "Uploaded photos have labeled angles, not measured camera calibration. Expected geometry is fitted/inferred. Browser evidence is background IAB render evidence and is not a foreground performance benchmark.",
        "Initial automated date fill did not commit React state; native ArrowUp/ArrowDown entry verified the corrected date. The intermediate wrong-date visit remains labeled and retained. An initial Noah screenshot captures lazy loading; final evidence verifies real loaded geometry and photos."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS cmd/api cached and internal/app 1.334s after meaningful visit tests. Immutable snapshot, selected-version changes, idempotent retry, incomplete views, chronological follow-up, confirmation, studio boundaries, SQLite reopen, transitive source erase, withdrawal and client deletion."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS Vite 1.48s. Expected 3D viewer lazy-loaded; existing 649.86kB viewer chunk warning retained."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS; internal/app 1.334s, cmd/api cached."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./...",
          "result": "PASS; internal/app 10.486s, cmd/api 1.027s. Tests cover ownership, anonymous denial, actual confirmation, stale expected versions, idempotency, immutable snapshots, source deletion, withdrawal and restart."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS; Vite 2.08s, 187 modules; native viewer remains a separate lazy chunk with the existing bundle-size advisory."
        },
        {
          "command": "scripts/populate-local-outcomes.py and scripts/verify-local-outcomes.py through the mandated local demo account",
          "result": "PASS: six positive simulated visits, original selection events, actual head GLBs and retained JPEGs, 72 distinct decoded source photos and anonymous API/media denial. Import checkpoint refuses recreation of deleted records."
        },
        {
          "command": "Browser: record visits, select eight angles, reopen, native zoom ArrowRight and reset",
          "result": "PASS. Reloaded retained follow-up has both actual loaded photos and edited native meshes. Zoom changes distance from 1.30 to 1.25m and reset restores the exact named front camera."
        }
      ],
      "pictures": [
        {
          "src": "assets/outcomes-empty-visit-browser.png",
          "caption": "Initial client state: no outcome record; source photo sets alone are not claimed as actual results.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-date-input-intermediate-browser.png",
          "caption": "Intermediate automated date entry failed to commit. The simulated record is retained as failure evidence.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-corrected-postcut-browser.png",
          "caption": "Corrected synthetic September 2 post-cut comparison with original baseline and the actual edited native expected proposal.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-followup-front-browser.png",
          "caption": "Synthetic follow-up front comparison, linked to the corrected earlier visit.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-followup-profile-browser.png",
          "caption": "Same labeled profile across original baseline, fitted expected proposal and simulated outcome.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-followup-back-browser.png",
          "caption": "Back comparison, including clearly inferred expected geometry.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-followup-reopened-browser.png",
          "caption": "Retained follow-up comparison after reopening.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-reloaded-zoom-browser.png",
          "caption": "Reloaded fictional Alex follow-up with real edited meshes and both source photos loaded, after explicit zoom/reset checks. Background rendering, not foreground performance.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-maya-followup-browser.png",
          "caption": "Fictional Maya follow-up with the retained MPFB expected proposal and real simulated source photos.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-noah-followup-loading-browser.png",
          "caption": "Intermediate lazy-loading state for fictional Noah, preserved separately from the successful render.",
          "date": "2026-09-30T16:09:59-03:00"
        },
        {
          "src": "assets/outcomes-noah-followup-browser.png",
          "caption": "Fictional Noah follow-up with loaded FLAME expected geometry and simulated photos.",
          "date": "2026-09-30T16:09:59-03:00"
        }
      ],
      "commits": [
        "0b3b0afd8b864bc676b26251279c4b7fffaf585a"
      ],
      "outputs": [
        {
          "href": "assets/outcomes-browser-angle-verification.json",
          "label": "Actual browser camera and angle observations"
        },
        {
          "href": "assets/outcomes-reloaded-zoom-verification.json",
          "label": "Reloaded mesh/photo readiness and explicit zoom/reset observations"
        },
        {
          "href": "assets/outcomes-populated-verification.json",
          "label": "Six populated simulated visit records and immutable references"
        },
        {
          "href": "assets/outcomes-live-verification.json",
          "label": "Live persistence, native artifacts, decoded media and access verification"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T15:09:21-03:00",
          "text": "Inspecting current behavior: labeled photo sets and consultation history exist, but no persisted post-cut/follow-up record captures the original baseline, selected expected version and actual labeled photos together. Existing simulated follow-up photos are assets, not proof of this workflow."
        },
        {
          "date": "2026-09-30T15:25:21-03:00",
          "text": "Initial outcome API tests reached persisted snapshots and SQLite reopen, then failed a test assertion expecting private,no-store. The shared JSON responder correctly emits no-store for all JSON. Corrected the assertion to the existing responder contract; no cache protection was removed."
        },
        {
          "date": "2026-09-30T15:32:53-03:00",
          "text": "Actual browser verification exposed an intermediate input failure: the IAB date fill displayed September 2 in the DOM but did not commit the controlled form state, so a subsequent field change restored September 30 and the first synthetic visit saved that default. Native ArrowUp/ArrowDown entry commits the date and survives later field edits. Preserve the first synthetic record and create an explicitly identified corrected example; no real visit data is involved."
        },
        {
          "date": "2026-09-30T16:09:59-03:00",
          "text": "Task 18 technically verified. Real outcomes and professional assessment remain pending; task 19 begins only after the local milestone commit."
        }
      ]
    },
    {
      "id": "19",
      "title": "Client self-upload and reminders",
      "depends": [
        "01",
        "04",
        "18"
      ],
      "requirement": "Scoped client intake/upload and local reminders without requiring a client account.",
      "criteria": [
        "Expiring/revocable client link permits only authorized intake/upload; no studio record disclosure.",
        "Local due reminders and follow-up state survive restart; withdrawal revokes links/reminders.",
        "Failures and misuse boundaries verified; no external messaging unless later authorized."
      ],
      "status": "verified",
      "changes": [
        "Implementation default: 24-hour upload link (configurable 1–168 hours), cryptographic token retained only as a hash; bearer travels in a URL fragment and request header, not an API URL. Each link creates a fresh photo set and snapshots an optional reusable intake template.",
        "Local reminders will be due-state records visible to studio users and, when requested, the scoped client portal. No external message delivery is configured or claimed.",
        "Implemented fresh link-specific photo sets, hashed fragment bearer tokens, 1–168 hour expiry, explicit revocation, immutable client-submitted consultation/template snapshots, studio review acknowledgement and authenticated local reminder queue.",
        "Client photo content is additionally limited to recorded link-upload origins; later studio assignment cannot expose prior studio media. Upload uses the existing real decode/size checks and atomic optimistic slot transaction under the erasure lock."
      ],
      "limitations": [
        "Local reminders are durable in-app due-state records; no email, SMS, operating-system push or external message delivery is configured or claimed. Bearer possession grants the selected submission only; it does not authenticate client identity.",
        "Client inputs and examples are fictional synthetic demonstrations. The initial intake remains immutable; professional corrections use the existing consultation revision workflow. Links expire and must be explicitly reissued rather than silently revived."
      ],
      "verification": [
        {
          "command": "Initial scoped-upload tests and build",
          "result": "FAIL: parsed r.Form bypassed forced slot assignment; a template fixture omitted its required updated_at field; one existing localization key was duplicated. Corrections retain optimistic slot checks, fix fixture metadata and reuse the existing translation."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS internal/app 1.597s, cmd/api cached after fixing initial failures."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./...",
          "result": "PASS internal/app 11.219s, cmd/api 1.024s; scoped tokens, template snapshots, decode failures, stale slots, bearer isolation, expiry/revocation, deletion/restart and reminder cancellation verified."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS Vite 2.00s, 188 modules. Existing lazy native viewer bundle-size advisory remains."
        },
        {
          "command": "scripts/populate-local-client-upload.py",
          "result": "PASS three real persisted fictional intakes, 24 decoded synthetic uploads, complete six plus optional two view sets, anonymous/studio isolation and client-visible versus internal local reminders."
        },
        {
          "command": "Browser intake, file chooser/review/cancel/retake/save, reload, studio review and reminder creation/completion/dismissal",
          "result": "PASS. Eight loaded client photos survive reload; studio review appears in the scoped portal; completed reminders leave the client pending list. One stale studio tab input timed out; a fresh tab verified actual actions."
        },
        {
          "command": "Browser revoked-link test",
          "result": "PASS: unavailable link exposes only the denial state, with no client record disclosure."
        }
      ],
      "pictures": [
        {
          "src": "assets/client-upload-empty-browser.png",
          "caption": "Initial scoped portal has an empty fresh set and no studio records.",
          "date": "2026-09-30T16:40:01-03:00"
        },
        {
          "src": "assets/client-upload-review-browser.png",
          "caption": "Actual fictional photo selected for client review before saving; cancellation and retake verified.",
          "date": "2026-09-30T16:40:01-03:00"
        },
        {
          "src": "assets/client-upload-studio-review-browser.png",
          "caption": "Studio review and completed local reminder, with no private bearer visible.",
          "date": "2026-09-30T16:40:01-03:00"
        },
        {
          "src": "assets/client-upload-reopened-browser.png",
          "caption": "Reloaded submitted intake and complete original synthetic views in the client-only portal.",
          "date": "2026-09-30T16:40:01-03:00"
        },
        {
          "src": "assets/client-upload-revoked-browser.png",
          "caption": "An explicitly revoked fictional test invitation shows no intake, photos or reminders.",
          "date": "2026-09-30T16:40:32-03:00"
        }
      ],
      "commits": [
        "0659e7d82090ce6d08fd156afcffa7ae9ca1f661"
      ],
      "outputs": [
        {
          "href": "assets/client-upload-live-verification.json",
          "label": "Three persisted fictional submissions and actual access/decoded-photo checks"
        },
        {
          "href": "assets/client-upload-browser-reminder-verification.json",
          "label": "Actual browser review, reminder completion and dismissal observations"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T16:13:10-03:00",
          "text": "Read the later broad MVP and permission decision plus current photo, consultation, authentication and erasure source before implementing task 19."
        },
        {
          "date": "2026-09-30T16:29:54-03:00",
          "text": "Added origin records so studio-assigned images cannot be disclosed through a client submission link."
        },
        {
          "date": "2026-09-30T16:40:32-03:00",
          "text": "Task 19 verified locally. Client links, submissions and reminders remain private; no external messages were sent."
        }
      ]
    },
    {
      "id": "20",
      "title": "Maintenance guidance and growth stages",
      "depends": [
        "03",
        "17",
        "18"
      ],
      "requirement": "Rich guidance and staged growth plans retained with the expected look.",
      "criteria": [
        "Styling steps, product categories, intervals and achievable stages editable and persisted.",
        "Future stages distinguished from immediate result; stage revisions preserve history.",
        "Fictional completed demo plans and follow-up evidence populated."
      ],
      "status": "verified",
      "changes": [
        "Reversible plan defaults: immutable revisions, 1–8 explicit stages with weeks relative to a chosen start date, editable daily care effort, washing/styling steps, product categories, trim/check-in intervals and feasibility notes. Stage visuals refer to retained real 3D options; no generated biological-growth prediction.",
        "Added exact plan/stage and exact observed-visit deep links, so review can reopen a specific immutable revision rather than defaulting to the newest record.",
        "Three completed synthetic plans now contain editable care routines and nine actual compatible stage proposals with separate linked simulated outcomes. The browser saved Alex revision 2 with four daily minutes while revision 1 remains five; expected selection version 2 remains unchanged.",
        "Fixed asynchronous exact-stage navigation: once the actual native proposal is ready, an explicit #growth-stage link scrolls to the requested retained stage. Ordinary page navigation does not force this scroll.",
        "Exact-stage navigation and the loaded proposals are verified in the browser for three fitters. A real canvas drag rotated the retained FLAME stage; wheel zoom changed its camera radius. The linked stage reopened the exact separate simulated follow-up record."
      ],
      "limitations": [
        "Background IAB inputs sometimes time out after dispatch during native scene changes. Real intermediate geometry loaded, revision save succeeded, and API checks passed. Final render evidence is checked separately; browser delays are not counted as successful actions without observed state.",
        "Plans provide configurable professional guidance and review checkpoints. Fictional example routines, product categories and dates are not medical advice, measured growth rates or promises of an achievable final result. User professional review and final route selection remain pending."
      ],
      "verification": [
        {
          "command": "Initial compilation and fictional population",
          "result": "FAIL then corrected: an incomplete loop brace prevented compilation; a keep-current stage correctly rejected inherited proposed-style deformations, so the new reference resets edits; the creation checkpoint now resumes an incomplete import without recreating any known deleted plan or option."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS internal/app 1.546s; cmd/api cached. Meaningful tests cover synthetic labeling, stale expected selections, invalid schedules, foreign options/visits, idempotency, immutable revisions, restart, transitive media deletion and withdrawn/client-deleted state."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./...",
          "result": "PASS internal/app 11.840s; cmd/api 1.029s."
        },
        {
          "command": "scripts/populate-local-maintenance.py and scripts/verify-local-maintenance.py",
          "result": "PASS three real retained plans, nine actual GLB head/style combinations, original expected JPEGs/events, simulated visit references, anonymous denial and preserved original/revised routines. Creation script refuses erased known work; verifier is read-only."
        },
        {
          "command": "npm --prefix web run build after exact-stage navigation correction",
          "result": "PASS Vite 1.59s, 189 modules. Main bundle ~505KB and native viewer ~650KB retain size advisories; browser delays and background measurements are reported separately."
        },
        {
          "command": "Browser retained plan revisions, native proposals, exact-stage reload, rotation/zoom and observed-visit navigation",
          "result": "PASS. Actual geometry and deformations loaded; viewport bounds place the target canvas at y247–687. Noah linked visit request and selected record IDs match exactly."
        }
      ],
      "pictures": [
        {
          "src": "assets/maintenance-revision-browser.png",
          "caption": "Actual browser revision retained with the original plan still present. Synthetic professional acceptance remains pending.",
          "date": "2026-09-30T17:13:49-03:00"
        },
        {
          "src": "assets/maintenance-intermediate-browser.png",
          "caption": "Loaded compatible crew-wavy and light-stubble geometry on the actual fitted Alex head. A planning reference with separate simulated follow-up, not a biological growth prediction.",
          "date": "2026-09-30T17:13:49-03:00"
        },
        {
          "src": "assets/maintenance-target-browser.png",
          "caption": "Exact Alex revision 2, week 8 target reopened at the loaded edited 3D view. This is a planning checkpoint, not a promised growth date.",
          "date": "2026-09-30T17:18:43-03:00"
        },
        {
          "src": "assets/maintenance-maya-browser.png",
          "caption": "Real MPFB intermediate coily hairstyle with independent clean-shaven choice in fictional Maya’s saved plan.",
          "date": "2026-09-30T17:18:43-03:00"
        },
        {
          "src": "assets/maintenance-noah-browser.png",
          "caption": "Actual FLAME intermediate side-part and circle beard in fictional Noah’s retained plan.",
          "date": "2026-09-30T17:18:43-03:00"
        },
        {
          "src": "assets/maintenance-noah-rotated-browser.png",
          "caption": "Actual browser rotation of the retained native FLAME planning proposal.",
          "date": "2026-09-30T17:18:43-03:00"
        }
      ],
      "commits": [
        "571e5bc0ee640af9d51d220f91a07883ff5dfa29"
      ],
      "outputs": [
        {
          "href": "assets/maintenance-populated-verification.json",
          "label": "Three populated fictional plans and nine native stage references"
        },
        {
          "href": "assets/maintenance-live-verification.json",
          "label": "Live original/revised guidance, native artifact headers and access checks"
        },
        {
          "href": "assets/maintenance-browser-verification.json",
          "label": "Observed loaded stage meshes, exact camera states and scope labels"
        },
        {
          "href": "assets/maintenance-stage-rotation-verification.json",
          "label": "Actual canvas-drag rotation measurements"
        },
        {
          "href": "assets/maintenance-stage-zoom-verification.json",
          "label": "Actual canvas wheel-zoom camera measurements"
        },
        {
          "href": "assets/maintenance-linked-visit-verification.json",
          "label": "Exact separately recorded simulated follow-up reopened from its stage link"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T16:42:10-03:00",
          "text": "Read consultation, expected-result and actual-progress decisions alongside the later broad MVP. Current code has editable intake and retained visits, but no structured maintenance or staged-growth workflow."
        },
        {
          "date": "2026-09-30T17:18:43-03:00",
          "text": "Task 20 verified locally. Professional feasibility, actual growth outcomes and final route selection remain pending user review."
        }
      ]
    },
    {
      "id": "21",
      "title": "Review-ready integrated handoff",
      "depends": [
        "15",
        "17",
        "18",
        "19",
        "20"
      ],
      "requirement": "Verify every local workflow and compare all candidates without choosing a winner.",
      "criteria": [
        "Complete local app and all candidate experiments available, with license and performance comparison.",
        "End-to-end reload, auth, deletion, asynchronous failure and regression checks pass.",
        "Log and relative images load; commits and retained outputs linked.",
        "Professional likeness/asset assessment and final route choice explicitly pending."
      ],
      "status": "blocked",
      "changes": [
        "Added a client-specific eight-candidate comparison in the running app, with actual native timing, retained sizes, RSS, saved options, explicit upstream roles, failure/blocker states and primary software/model terms. Added the portable comparison to the requested HTML log."
      ],
      "limitations": [
        "Meshroom native reconstruction remains incomplete pending the user’s acceptance of the CUDA 12.1.1 agreement included with the official AliceVision 3.3.0 runtime. Task 09 and the all-candidate handoff criterion remain blocked. Prepared graph and input diagnostics are available, not a completed reconstruction demo.",
        "COLMAP failed the agreed original six-photo capture for all three synthetic cases and both presets: no usable registered head. Task 08 remains failed; dependent native style/expected-result workflow requirements are unmet for this candidate. Its actual runnable experiment and failures remain available.",
        "No real-person likeness or independent measured geometry validation. Original procedural 3D assets, approximate attachments, clipping, achievable cuts and maintenance suitability require the user’s professional assessment. No final route selected.",
        "Local reminders require opening the app/portal; no external delivery is configured or claimed. Production rollout and production backup safeguards are not verified; the backup flow was removed at the user’s later instruction.",
        "Bundle warnings remain: main 509 kB and lazy 3D viewer 650 kB. Native FPS observations use a hidden IAB and warm local cache. They do not establish foreground customer-device performance; fresh CloudCompare FPS sample unavailable."
      ],
      "verification": [
        {
          "command": "scripts/verify-local-review.py",
          "result": "PASS original six photograph hashes and decoding for all three cases; 36 current native runs, 2736 native style headers, upstream head hashes, anonymous denials, preserved options/selection/visits/upload/reminders/plans. Read only; no recreation."
        },
        {
          "command": "scripts/verify-local-demos.py",
          "result": "PASS all 76 actual library GLBs, eight routes, real asynchronous diagnostics, immutable input replacement, workspace and option reload/conflicts, source erasure, cancellation, withdrawal and disposable client deletion."
        },
        {
          "command": "scripts/verify-local-privacy.py",
          "result": "PASS real local permission entry, wrong-name rejection, single-use link, private media access, withdrawal, fresh acknowledgement, complete disposable erasure and nonidentifying completion history."
        },
        {
          "command": "scripts/verify-local-outcomes.py; scripts/verify-local-maintenance.py",
          "result": "PASS six retained simulated visits and 72 decoded images, original expected event history, four immutable plan revisions, nine native stage references and private media."
        },
        {
          "command": "npm --prefix web run build; mise exec go@1.26.0 -- go test ./...",
          "result": "PASS final comparison/translation build: 190 modules, 1.99 s; Go packages passed (cached). Vite retains 509 kB main and 650 kB lazy viewer bundle warnings."
        },
        {
          "command": "@Browser: final-selector-browser-verification.json; final-native-browser-verification.json",
          "result": "PASS eight workflow buttons, six exact persisted native proposal reloads, actual render/geometry edit fingerprints, unchanged current hair/beard, independent proposed hair/beard deformation and synchronized named camera controls. Browser physically hidden; available FPS/load samples are qualified, CloudCompare fresh sample unavailable."
        },
        {
          "command": "@Browser: HTML log selector and console",
          "result": "PASS task selector switched from 15 to 21, correct task headings and blocked status rendered; no browser warnings/errors on the log."
        },
        {
          "command": "scripts/verify-execution-log.py",
          "result": "PASS 408 relative linked resources HTTP 200 and byte-identical to local files; 201 decoded pictures, comparison provenance included, at most one active task. Final log browser screenshot is checked in the next audit."
        }
      ],
      "pictures": [
        {
          "src": "assets/final-candidate-comparison.png",
          "caption": "Final app comparison with current actual counts and qualified measurements; all eight alternatives retained.",
          "date": "2026-09-30T17:38:32-03:00"
        },
        {
          "src": "assets/final-colmap-workflow.png",
          "caption": "Actual COLMAP six-photo settings and retained-input workflow; failed reconstruction remains separate from fitting alternatives.",
          "date": "2026-09-30T17:38:32-03:00"
        },
        {
          "src": "assets/final-blender-mpfb-reopened.png",
          "caption": "Actual reopened MPFB proposal. Current/proposed fitted template and original procedural styles; hidden geometry and professional style quality remain unvalidated.",
          "date": "2026-09-30T17:47:34-03:00"
        },
        {
          "src": "assets/final-makehuman-reopened.png",
          "caption": "Actual reopened MakeHuman saved proposal with independent styles and retained refinements; synthetic input, fitted/inferred geometry.",
          "date": "2026-09-30T17:47:34-03:00"
        },
        {
          "src": "assets/final-flame-reopened.png",
          "caption": "Actual reopened licensed FLAME 2023 Open proposal. Independent hairstyle and beardstyle edits replayed; approximate style attachment, professional clipping and likeness review pending.",
          "date": "2026-09-30T17:47:34-03:00"
        },
        {
          "src": "assets/final-open3d-reopened.png",
          "caption": "Actual Open3D processed MakeHuman proposal, saved styles and refinements reopened. The upstream fitting dependency is retained; this is not photo reconstruction.",
          "date": "2026-09-30T17:47:34-03:00"
        },
        {
          "src": "assets/final-meshlab-reopened.png",
          "caption": "Actual MeshLab processed MakeHuman proposal, saved styles and refinements reopened. No missing client surfaces were measured or filled.",
          "date": "2026-09-30T17:47:34-03:00"
        },
        {
          "src": "assets/final-cloudcompare-reopened.png",
          "caption": "Actual CloudCompare route with retained MakeHuman fit and synchronized three-quarter camera. Native registration evaluates geometry; it does not generate measured anatomy.",
          "date": "2026-09-30T17:47:34-03:00"
        },
        {
          "src": "assets/final-log-browser.png",
          "caption": "Final portable HTML task selector shows the integration handoff blocked rather than complete; all completed tasks, failures and pending native runtime requirement remain visible.",
          "date": "2026-09-30T17:51:04-03:00"
        }
      ],
      "commits": [],
      "outputs": [
        {
          "href": "assets/candidate-comparison.json",
          "label": "Read-only live comparison of all eight candidates and measured runs"
        },
        {
          "href": "assets/final-demo-boundary-checks.txt",
          "label": "Actual final asynchronous demo/persistence/source-erasure verification output"
        },
        {
          "href": "assets/final-privacy-boundary-checks.txt",
          "label": "Actual final permission/withdrawal/deletion verification output"
        },
        {
          "href": "assets/final-review-options.json",
          "label": "Exact persisted native option links for all six working routes"
        },
        {
          "href": "assets/final-selector-browser-verification.json",
          "label": "Actual eight workflow button navigation and visible settings"
        },
        {
          "href": "assets/final-native-browser-verification.json",
          "label": "Actual final native proposal reloads, mesh edit fingerprints, cameras and qualified browser performance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T17:20:28-03:00",
          "text": "Begin final local integration review, keeping all eight candidates available. COLMAP’s actual six-photo failures, the still-gated AliceVision runtime, removed backup scope, unvalidated real likeness and pending professional assessment remain explicit."
        },
        {
          "date": "2026-09-30T17:36:35-03:00",
          "text": "Initial review table build failed because result types duplicated elapsedMs/resources and omitted catalog. Reused existing types, added actual immutable catalog fields, corrected supporting-role detection, and rebuilt successfully."
        },
        {
          "date": "2026-09-30T17:47:34-03:00",
          "text": "Browser verifier initially waited for FPS inspection before bringing MPFB on screen. Its filtered first/last selector then matched only the faster proposed viewer for Open3D and MeshLab. Readiness was corrected to address current/proposed hosts separately; actual parsed fingerprints, screenshots and synchronized cameras were verified. CloudCompare parsed/rendered both meshes with no console errors but its fresh FPS sample remained unavailable in the hidden IAB. These earlier deadlines are not counted as passed checks."
        },
        {
          "date": "2026-09-30T17:47:34-03:00",
          "text": "All currently independent implementation and final integration checks completed locally. Review workspace is available, but the full all-candidate handoff remains blocked specifically by Meshroom runtime license acceptance. COLMAP remains an honest unsuitable six-photo experiment. No unmet native reconstruction requirement is marked complete."
        }
      ]
    }
  ],
  "comparison": {
    "verifiedAt": "2026-09-30T20:35:02.281078+00:00",
    "scope": "Observed pixels and detected 2D features; fitted and inferred surfaces, including hidden regions. Supporting tools process explicitly identified upstream templates. Synthetic outcomes are not actual haircut results.",
    "pending": [
      "Real-client likeness and professional style quality/clipping/coverage/maintenance assessment",
      "Final reconstruction/fitting route choice",
      "Meshroom runtime agreement acceptance and native evaluation"
    ],
    "candidates": [
      {
        "id": "blender-mpfb",
        "name": "Blender + MPFB",
        "role": "Parametric head fitting",
        "status": "verified local workflow",
        "runs": 3,
        "effort": "53.15 to 54.16 s; 173.9 to 177.7 MiB retained; 1152.2 MiB reported peak RSS",
        "dependency": "",
        "provenance": "assets/native-mpfb-provenance.json",
        "task": "07"
      },
      {
        "id": "colmap",
        "name": "COLMAP / PyCOLMAP",
        "role": "Photogrammetric reconstruction",
        "status": "failed",
        "runs": 8,
        "effort": "0.81 to 1.34 s; 6.0 to 7.6 MiB retained; 889.9 MiB reported peak RSS",
        "dependency": "",
        "provenance": "assets/colmap-provenance.json",
        "task": "08"
      },
      {
        "id": "meshroom",
        "name": "Meshroom / AliceVision",
        "role": "Photogrammetric reconstruction",
        "status": "blocked",
        "runs": 0,
        "effort": "Native runtime not acquired; source graph and setup retained.",
        "dependency": "",
        "provenance": "assets/meshroom-setup-provenance.json",
        "task": "09"
      },
      {
        "id": "makehuman",
        "name": "Standalone MakeHuman",
        "role": "Parametric head fitting",
        "status": "verified local workflow",
        "runs": 3,
        "effort": "16.25 to 17.17 s; 142.9 to 146.2 MiB retained; 284.1 MiB reported peak RSS",
        "dependency": "",
        "provenance": "assets/makehuman-provenance.json",
        "task": "10"
      },
      {
        "id": "flame",
        "name": "FLAME 2023 Open",
        "role": "Parametric head fitting",
        "status": "verified local workflow",
        "runs": 3,
        "effort": "32.23 to 32.71 s; 161.7 to 166.3 MiB retained; 264.6 MiB reported peak RSS",
        "dependency": "",
        "provenance": "assets/flame-open-provenance.json",
        "task": "11"
      },
      {
        "id": "open3d",
        "name": "Open3D",
        "role": "Supporting geometry processing",
        "status": "verified local workflow",
        "runs": 9,
        "effort": "3.29 to 3.84 s; 229.5 to 325.9 MiB retained; 181.3 MiB reported peak RSS",
        "dependency": "Requires an identified reconstruction or fitting result",
        "provenance": "assets/open3d-provenance.json",
        "task": "12"
      },
      {
        "id": "meshlab",
        "name": "MeshLab / PyMeshLab",
        "role": "Supporting mesh processing",
        "status": "verified local workflow",
        "runs": 9,
        "effort": "2.69 to 3.28 s; 228.9 to 325.2 MiB retained; 165.4 MiB reported peak RSS",
        "dependency": "Requires an identified reconstruction or fitting result",
        "provenance": "assets/meshlab-provenance.json",
        "task": "13"
      },
      {
        "id": "cloudcompare",
        "name": "CloudCompare",
        "role": "Supporting alignment and comparison",
        "status": "verified local workflow",
        "runs": 9,
        "effort": "5.64 to 7.54 s; 362.3 to 461.9 MiB retained; 155.1 MiB reported peak RSS",
        "dependency": "Requires an identified reconstruction or fitting result",
        "provenance": "assets/cloudcompare-provenance.json",
        "task": "14"
      }
    ]
  }
};
