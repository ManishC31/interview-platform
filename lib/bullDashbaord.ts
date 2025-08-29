import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import resultQueue from "@/queues/resultQueue";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/queues");

createBullBoard({
  queues: [new BullMQAdapter(resultQueue)],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: "Interview Platform Queues",
      boardLogo: {
        path: "https://www.assesshub.com/wp-content/uploads/2022/09/Asset-2.svg",
        height: "auto",
        width: "90%",
      },
      favIcon: {
        default: "https://www.assesshub.com/wp-content/uploads/2022/09/new-favicon.svg",
        alternative: "https://www.assesshub.com/wp-content/uploads/2022/09/new-favicon.svg",
      },
    },
  },
});


export default serverAdapter