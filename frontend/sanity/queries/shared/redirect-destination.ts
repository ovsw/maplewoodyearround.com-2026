import { groq } from "next-sanity";

/** Resolve a redirect's selected document to its public route. */
export const redirectDestinationPath = groq`select(
  destinationReference->_id == "homePage" || destinationReference->_type == "homePage" => "/",
  destinationReference->_id == "blogIndex" || destinationReference->_type == "blogIndex" => "/blog",
  destinationReference->_type == "post" && defined(destinationReference->slug.current) => "/blog/" + array::join(string::split(destinationReference->slug.current, "/")[@ != ""], "/"),
  destinationReference->_type == "category" && defined(destinationReference->slug.current) => "/blog/category/" + array::join(string::split(destinationReference->slug.current, "/")[@ != ""], "/"),
  destinationReference->_type == "page" && defined(destinationReference->slug.current) => "/" + array::join(string::split(destinationReference->slug.current, "/")[@ != ""], "/")
)`;
