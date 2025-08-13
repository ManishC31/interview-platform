import { ModeToggle } from "./ModeToggle";

export const Footer = () => {
  return (
    <footer>
      <hr className="w-11/12 mx-auto" />
      <section className="flex items-center justify-between py-4 w-11/12 mx-auto relative">
        {/* Button aligned to the left */}
        <div className="absolute left-0">
          <ModeToggle />
        </div>

        {/* Text centered */}
        <h3 className="font-semibold w-full text-center">
          &copy; 2025 Powered by Five Elements Pvt Ltd
        </h3>
      </section>
    </footer>
  );
};
