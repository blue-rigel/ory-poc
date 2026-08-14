import "./Loader.css";

type LoaderProps = {
  message?: string;
};

function Loader(props: LoaderProps) {
  const { message } = props;
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <h2>{message || "Loading..."}</h2>
    </div>
  );
}

export default Loader;
