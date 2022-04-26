type EmptyObject = Record<string, never>

type PropertyBase = { type: string }
type TitlePropertyValue = {
  type: "title"
  title: Array<
    | {
        type: "text"
        text: {
          content: string
          link: {
            url: string
          } | null
        }
        annotations: {
          bold: boolean
          italic: boolean
          strikethrough: boolean
          underline: boolean
          code: boolean
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
            | "gray_background"
            | "brown_background"
            | "orange_background"
            | "yellow_background"
            | "green_background"
            | "blue_background"
            | "purple_background"
            | "pink_background"
            | "red_background"
        }
        plain_text: string
        href: string | null
      }
    | {
        type: "mention"
        mention:
          | {
              type: "user"
              user:
                | {
                    id: string
                    object: "user"
                  }
                | {
                    type: "person"
                    person: {
                      email?: string
                    }
                    name: string | null
                    avatar_url: string | null
                    id: string
                    object: "user"
                  }
                | {
                    type: "bot"
                    bot:
                      | EmptyObject
                      | {
                          owner:
                            | {
                                type: "user"
                                user:
                                  | {
                                      type: "person"
                                      person: {
                                        email: string
                                      }
                                      name: string | null
                                      avatar_url: string | null
                                      id: string
                                      object: "user"
                                    }
                                  | {
                                      id: string
                                      object: "user"
                                    }
                              }
                            | {
                                type: "workspace"
                                workspace: true
                              }
                        }
                    name: string | null
                    avatar_url: string | null
                    id: string
                    object: "user"
                  }
            }
          | {
              type: "date"
              date: {
                start: string
                end: string | null
                time_zone: string | null
              }
            }
          | {
              type: "link_preview"
              link_preview: {
                url: string
              }
            }
          | {
              type: "page"
              page: {
                id: string
              }
            }
          | {
              type: "database"
              database: {
                id: string
              }
            }
        annotations: {
          bold: boolean
          italic: boolean
          strikethrough: boolean
          underline: boolean
          code: boolean
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
            | "gray_background"
            | "brown_background"
            | "orange_background"
            | "yellow_background"
            | "green_background"
            | "blue_background"
            | "purple_background"
            | "pink_background"
            | "red_background"
        }
        plain_text: string
        href: string | null
      }
    | {
        type: "equation"
        equation: {
          expression: string
        }
        annotations: {
          bold: boolean
          italic: boolean
          strikethrough: boolean
          underline: boolean
          code: boolean
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
            | "gray_background"
            | "brown_background"
            | "orange_background"
            | "yellow_background"
            | "green_background"
            | "blue_background"
            | "purple_background"
            | "pink_background"
            | "red_background"
        }
        plain_text: string
        href: string | null
      }
  >
  id: string
}
type RicheTextPropertyValue = {
  type: "rich_text"
  rich_text: Array<
    | {
        type: "text"
        text: {
          content: string
          link: {
            url: string
          } | null
        }
        annotations: {
          bold: boolean
          italic: boolean
          strikethrough: boolean
          underline: boolean
          code: boolean
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
            | "gray_background"
            | "brown_background"
            | "orange_background"
            | "yellow_background"
            | "green_background"
            | "blue_background"
            | "purple_background"
            | "pink_background"
            | "red_background"
        }
        plain_text: string
        href: string | null
      }
    | {
        type: "mention"
        mention:
          | {
              type: "user"
              user:
                | {
                    id: string
                    object: "user"
                  }
                | {
                    type: "person"
                    person: {
                      email?: string
                    }
                    name: string | null
                    avatar_url: string | null
                    id: string
                    object: "user"
                  }
                | {
                    type: "bot"
                    bot:
                      | EmptyObject
                      | {
                          owner:
                            | {
                                type: "user"
                                user:
                                  | {
                                      type: "person"
                                      person: {
                                        email: string
                                      }
                                      name: string | null
                                      avatar_url: string | null
                                      id: string
                                      object: "user"
                                    }
                                  | {
                                      id: string
                                      object: "user"
                                    }
                              }
                            | {
                                type: "workspace"
                                workspace: true
                              }
                        }
                    name: string | null
                    avatar_url: string | null
                    id: string
                    object: "user"
                  }
            }
          | {
              type: "date"
              date: {
                start: string
                end: string | null
                time_zone: string | null
              }
            }
          | {
              type: "link_preview"
              link_preview: {
                url: string
              }
            }
          | {
              type: "page"
              page: {
                id: string
              }
            }
          | {
              type: "database"
              database: {
                id: string
              }
            }
        annotations: {
          bold: boolean
          italic: boolean
          strikethrough: boolean
          underline: boolean
          code: boolean
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
            | "gray_background"
            | "brown_background"
            | "orange_background"
            | "yellow_background"
            | "green_background"
            | "blue_background"
            | "purple_background"
            | "pink_background"
            | "red_background"
        }
        plain_text: string
        href: string | null
      }
    | {
        type: "equation"
        equation: {
          expression: string
        }
        annotations: {
          bold: boolean
          italic: boolean
          strikethrough: boolean
          underline: boolean
          code: boolean
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
            | "gray_background"
            | "brown_background"
            | "orange_background"
            | "yellow_background"
            | "green_background"
            | "blue_background"
            | "purple_background"
            | "pink_background"
            | "red_background"
        }
        plain_text: string
        href: string | null
      }
  >
  id: string
}
type CheckboxPropertyValue = {
  type: "checkbox"
  checkbox: boolean
  id: string
}
type SelectPropertyValue = {
  type: "select"
  select: {
    id: string
    name: string
    color:
      | "default"
      | "gray"
      | "brown"
      | "orange"
      | "yellow"
      | "green"
      | "blue"
      | "purple"
      | "pink"
      | "red"
  } | null
  id: string
}

export type Page = {
  parent:
    | { type: "database_id"; database_id: string }
    | { type: "page_id"; page_id: string }
    | { type: "workspace"; workspace: true }
  properties: Record<
    string,
    | TitlePropertyValue
    | RicheTextPropertyValue
    | {
        type: "number"
        number: number | null
        id: string
      }
    | {
        type: "url"
        url: string | null
        id: string
      }
    | SelectPropertyValue
    | {
        type: "multi_select"
        multi_select: Array<{
          id: string
          name: string
          color:
            | "default"
            | "gray"
            | "brown"
            | "orange"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink"
            | "red"
        }>
        id: string
      }
    | {
        type: "people"
        people: Array<
          | {
              id: string
              object: "user"
            }
          | {
              type: "person"
              person: {
                email?: string
              }
              name: string | null
              avatar_url: string | null
              id: string
              object: "user"
            }
          | {
              type: "bot"
              bot:
                | EmptyObject
                | {
                    owner:
                      | {
                          type: "user"
                          user:
                            | {
                                type: "person"
                                person: {
                                  email: string
                                }
                                name: string | null
                                avatar_url: string | null
                                id: string
                                object: "user"
                              }
                            | {
                                id: string
                                object: "user"
                              }
                        }
                      | {
                          type: "workspace"
                          workspace: true
                        }
                  }
              name: string | null
              avatar_url: string | null
              id: string
              object: "user"
            }
        >
        id: string
      }
    | {
        type: "email"
        email: string | null
        id: string
      }
    | {
        type: "phone_number"
        phone_number: string | null
        id: string
      }
    | {
        type: "date"
        date: {
          start: string
          end: string | null
          time_zone: string | null
        } | null
        id: string
      }
    | {
        type: "files"
        files: Array<
          | {
              file: {
                url: string
                expiry_time: string
              }
              name: string
              type?: "file"
            }
          | {
              external: {
                url: string
              }
              name: string
              type?: "external"
            }
        >
        id: string
      }
    | CheckboxPropertyValue
    | {
        type: "formula"
        formula:
          | {
              type: "string"
              string: string | null
            }
          | {
              type: "date"
              date: {
                start: string
                end: string | null
                time_zone: string | null
              } | null
            }
          | {
              type: "number"
              number: number | null
            }
          | {
              type: "boolean"
              boolean: boolean | null
            }
        id: string
      }
    | {
        type: "relation"
        relation: Array<{
          id: string
        }>
        id: string
      }
    | {
        type: "created_time"
        created_time: string
        id: string
      }
    | {
        type: "created_by"
        created_by:
          | {
              id: string
              object: "user"
            }
          | {
              type: "person"
              person: {
                email?: string
              }
              name: string | null
              avatar_url: string | null
              id: string
              object: "user"
            }
          | {
              type: "bot"
              bot:
                | EmptyObject
                | {
                    owner:
                      | {
                          type: "user"
                          user:
                            | {
                                type: "person"
                                person: {
                                  email: string
                                }
                                name: string | null
                                avatar_url: string | null
                                id: string
                                object: "user"
                              }
                            | {
                                id: string
                                object: "user"
                              }
                        }
                      | {
                          type: "workspace"
                          workspace: true
                        }
                  }
              name: string | null
              avatar_url: string | null
              id: string
              object: "user"
            }
        id: string
      }
    | {
        type: "last_edited_time"
        last_edited_time: string
        id: string
      }
    | {
        type: "last_edited_by"
        last_edited_by:
          | {
              id: string
              object: "user"
            }
          | {
              type: "person"
              person: {
                email?: string
              }
              name: string | null
              avatar_url: string | null
              id: string
              object: "user"
            }
          | {
              type: "bot"
              bot:
                | EmptyObject
                | {
                    owner:
                      | {
                          type: "user"
                          user:
                            | {
                                type: "person"
                                person: {
                                  email: string
                                }
                                name: string | null
                                avatar_url: string | null
                                id: string
                                object: "user"
                              }
                            | {
                                id: string
                                object: "user"
                              }
                        }
                      | {
                          type: "workspace"
                          workspace: true
                        }
                  }
              name: string | null
              avatar_url: string | null
              id: string
              object: "user"
            }
        id: string
      }
    | {
        type: "rollup"
        rollup:
          | {
              type: "number"
              number: number | null
              function:
                | "count"
                | "count_values"
                | "empty"
                | "not_empty"
                | "unique"
                | "show_unique"
                | "percent_empty"
                | "percent_not_empty"
                | "sum"
                | "average"
                | "median"
                | "min"
                | "max"
                | "range"
                | "earliest_date"
                | "latest_date"
                | "date_range"
                | "checked"
                | "unchecked"
                | "percent_checked"
                | "percent_unchecked"
                | "show_original"
            }
          | {
              type: "date"
              date: {
                start: string
                end: string | null
                time_zone: string | null
              } | null
              function:
                | "count"
                | "count_values"
                | "empty"
                | "not_empty"
                | "unique"
                | "show_unique"
                | "percent_empty"
                | "percent_not_empty"
                | "sum"
                | "average"
                | "median"
                | "min"
                | "max"
                | "range"
                | "earliest_date"
                | "latest_date"
                | "date_range"
                | "checked"
                | "unchecked"
                | "percent_checked"
                | "percent_unchecked"
                | "show_original"
            }
          | {
              type: "array"
              array: Array<
                | {
                    type: "title"
                    title: Array<
                      | {
                          type: "text"
                          text: {
                            content: string
                            link: {
                              url: string
                            } | null
                          }
                          annotations: {
                            bold: boolean
                            italic: boolean
                            strikethrough: boolean
                            underline: boolean
                            code: boolean
                            color:
                              | "default"
                              | "gray"
                              | "brown"
                              | "orange"
                              | "yellow"
                              | "green"
                              | "blue"
                              | "purple"
                              | "pink"
                              | "red"
                              | "gray_background"
                              | "brown_background"
                              | "orange_background"
                              | "yellow_background"
                              | "green_background"
                              | "blue_background"
                              | "purple_background"
                              | "pink_background"
                              | "red_background"
                          }
                          plain_text: string
                          href: string | null
                        }
                      | {
                          type: "mention"
                          mention:
                            | {
                                type: "user"
                                user:
                                  | {
                                      id: string
                                      object: "user"
                                    }
                                  | {
                                      type: "person"
                                      person: {
                                        email?: string
                                      }
                                      name: string | null
                                      avatar_url: string | null
                                      id: string
                                      object: "user"
                                    }
                                  | {
                                      type: "bot"
                                      bot:
                                        | EmptyObject
                                        | {
                                            owner:
                                              | {
                                                  type: "user"
                                                  user:
                                                    | {
                                                        type: "person"
                                                        person: {
                                                          email: string
                                                        }
                                                        name: string | null
                                                        avatar_url:
                                                          | string
                                                          | null
                                                        id: string
                                                        object: "user"
                                                      }
                                                    | {
                                                        id: string
                                                        object: "user"
                                                      }
                                                }
                                              | {
                                                  type: "workspace"
                                                  workspace: true
                                                }
                                          }
                                      name: string | null
                                      avatar_url: string | null
                                      id: string
                                      object: "user"
                                    }
                              }
                            | {
                                type: "date"
                                date: {
                                  start: string
                                  end: string | null
                                  time_zone: string | null
                                }
                              }
                            | {
                                type: "link_preview"
                                link_preview: {
                                  url: string
                                }
                              }
                            | {
                                type: "page"
                                page: {
                                  id: string
                                }
                              }
                            | {
                                type: "database"
                                database: {
                                  id: string
                                }
                              }
                          annotations: {
                            bold: boolean
                            italic: boolean
                            strikethrough: boolean
                            underline: boolean
                            code: boolean
                            color:
                              | "default"
                              | "gray"
                              | "brown"
                              | "orange"
                              | "yellow"
                              | "green"
                              | "blue"
                              | "purple"
                              | "pink"
                              | "red"
                              | "gray_background"
                              | "brown_background"
                              | "orange_background"
                              | "yellow_background"
                              | "green_background"
                              | "blue_background"
                              | "purple_background"
                              | "pink_background"
                              | "red_background"
                          }
                          plain_text: string
                          href: string | null
                        }
                      | {
                          type: "equation"
                          equation: {
                            expression: string
                          }
                          annotations: {
                            bold: boolean
                            italic: boolean
                            strikethrough: boolean
                            underline: boolean
                            code: boolean
                            color:
                              | "default"
                              | "gray"
                              | "brown"
                              | "orange"
                              | "yellow"
                              | "green"
                              | "blue"
                              | "purple"
                              | "pink"
                              | "red"
                              | "gray_background"
                              | "brown_background"
                              | "orange_background"
                              | "yellow_background"
                              | "green_background"
                              | "blue_background"
                              | "purple_background"
                              | "pink_background"
                              | "red_background"
                          }
                          plain_text: string
                          href: string | null
                        }
                    >
                  }
                | {
                    type: "rich_text"
                    rich_text: Array<
                      | {
                          type: "text"
                          text: {
                            content: string
                            link: {
                              url: string
                            } | null
                          }
                          annotations: {
                            bold: boolean
                            italic: boolean
                            strikethrough: boolean
                            underline: boolean
                            code: boolean
                            color:
                              | "default"
                              | "gray"
                              | "brown"
                              | "orange"
                              | "yellow"
                              | "green"
                              | "blue"
                              | "purple"
                              | "pink"
                              | "red"
                              | "gray_background"
                              | "brown_background"
                              | "orange_background"
                              | "yellow_background"
                              | "green_background"
                              | "blue_background"
                              | "purple_background"
                              | "pink_background"
                              | "red_background"
                          }
                          plain_text: string
                          href: string | null
                        }
                      | {
                          type: "mention"
                          mention:
                            | {
                                type: "user"
                                user:
                                  | {
                                      id: string
                                      object: "user"
                                    }
                                  | {
                                      type: "person"
                                      person: {
                                        email?: string
                                      }
                                      name: string | null
                                      avatar_url: string | null
                                      id: string
                                      object: "user"
                                    }
                                  | {
                                      type: "bot"
                                      bot:
                                        | EmptyObject
                                        | {
                                            owner:
                                              | {
                                                  type: "user"
                                                  user:
                                                    | {
                                                        type: "person"
                                                        person: {
                                                          email: string
                                                        }
                                                        name: string | null
                                                        avatar_url:
                                                          | string
                                                          | null
                                                        id: string
                                                        object: "user"
                                                      }
                                                    | {
                                                        id: string
                                                        object: "user"
                                                      }
                                                }
                                              | {
                                                  type: "workspace"
                                                  workspace: true
                                                }
                                          }
                                      name: string | null
                                      avatar_url: string | null
                                      id: string
                                      object: "user"
                                    }
                              }
                            | {
                                type: "date"
                                date: {
                                  start: string
                                  end: string | null
                                  time_zone: string | null
                                }
                              }
                            | {
                                type: "link_preview"
                                link_preview: {
                                  url: string
                                }
                              }
                            | {
                                type: "page"
                                page: {
                                  id: string
                                }
                              }
                            | {
                                type: "database"
                                database: {
                                  id: string
                                }
                              }
                          annotations: {
                            bold: boolean
                            italic: boolean
                            strikethrough: boolean
                            underline: boolean
                            code: boolean
                            color:
                              | "default"
                              | "gray"
                              | "brown"
                              | "orange"
                              | "yellow"
                              | "green"
                              | "blue"
                              | "purple"
                              | "pink"
                              | "red"
                              | "gray_background"
                              | "brown_background"
                              | "orange_background"
                              | "yellow_background"
                              | "green_background"
                              | "blue_background"
                              | "purple_background"
                              | "pink_background"
                              | "red_background"
                          }
                          plain_text: string
                          href: string | null
                        }
                      | {
                          type: "equation"
                          equation: {
                            expression: string
                          }
                          annotations: {
                            bold: boolean
                            italic: boolean
                            strikethrough: boolean
                            underline: boolean
                            code: boolean
                            color:
                              | "default"
                              | "gray"
                              | "brown"
                              | "orange"
                              | "yellow"
                              | "green"
                              | "blue"
                              | "purple"
                              | "pink"
                              | "red"
                              | "gray_background"
                              | "brown_background"
                              | "orange_background"
                              | "yellow_background"
                              | "green_background"
                              | "blue_background"
                              | "purple_background"
                              | "pink_background"
                              | "red_background"
                          }
                          plain_text: string
                          href: string | null
                        }
                    >
                  }
                | {
                    type: "number"
                    number: number | null
                  }
                | {
                    type: "url"
                    url: string | null
                  }
                | {
                    type: "select"
                    select: {
                      id: string
                      name: string
                      color:
                        | "default"
                        | "gray"
                        | "brown"
                        | "orange"
                        | "yellow"
                        | "green"
                        | "blue"
                        | "purple"
                        | "pink"
                        | "red"
                    } | null
                  }
                | {
                    type: "multi_select"
                    multi_select: Array<{
                      id: string
                      name: string
                      color:
                        | "default"
                        | "gray"
                        | "brown"
                        | "orange"
                        | "yellow"
                        | "green"
                        | "blue"
                        | "purple"
                        | "pink"
                        | "red"
                    }>
                  }
                | {
                    type: "people"
                    people: Array<
                      | {
                          id: string
                          object: "user"
                        }
                      | {
                          type: "person"
                          person: {
                            email?: string
                          }
                          name: string | null
                          avatar_url: string | null
                          id: string
                          object: "user"
                        }
                      | {
                          type: "bot"
                          bot:
                            | EmptyObject
                            | {
                                owner:
                                  | {
                                      type: "user"
                                      user:
                                        | {
                                            type: "person"
                                            person: {
                                              email: string
                                            }
                                            name: string | null
                                            avatar_url: string | null
                                            id: string
                                            object: "user"
                                          }
                                        | {
                                            id: string
                                            object: "user"
                                          }
                                    }
                                  | {
                                      type: "workspace"
                                      workspace: true
                                    }
                              }
                          name: string | null
                          avatar_url: string | null
                          id: string
                          object: "user"
                        }
                    >
                  }
                | {
                    type: "email"
                    email: string | null
                  }
                | {
                    type: "phone_number"
                    phone_number: string | null
                  }
                | {
                    type: "date"
                    date: {
                      start: string
                      end: string | null
                      time_zone: string | null
                    } | null
                  }
                | {
                    type: "files"
                    files: Array<
                      | {
                          file: {
                            url: string
                            expiry_time: string
                          }
                          name: string
                          type?: "file"
                        }
                      | {
                          external: {
                            url: string
                          }
                          name: string
                          type?: "external"
                        }
                    >
                  }
                | {
                    type: "checkbox"
                    checkbox: boolean
                  }
                | {
                    type: "formula"
                    formula:
                      | {
                          type: "string"
                          string: string | null
                        }
                      | {
                          type: "date"
                          date: {
                            start: string
                            end: string | null
                            time_zone: string | null
                          } | null
                        }
                      | {
                          type: "number"
                          number: number | null
                        }
                      | {
                          type: "boolean"
                          boolean: boolean | null
                        }
                  }
                | {
                    type: "relation"
                    relation: Array<{
                      id: string
                    }>
                  }
                | {
                    type: "created_time"
                    created_time: string
                  }
                | {
                    type: "created_by"
                    created_by:
                      | {
                          id: string
                          object: "user"
                        }
                      | {
                          type: "person"
                          person: {
                            email?: string
                          }
                          name: string | null
                          avatar_url: string | null
                          id: string
                          object: "user"
                        }
                      | {
                          type: "bot"
                          bot:
                            | EmptyObject
                            | {
                                owner:
                                  | {
                                      type: "user"
                                      user:
                                        | {
                                            type: "person"
                                            person: {
                                              email: string
                                            }
                                            name: string | null
                                            avatar_url: string | null
                                            id: string
                                            object: "user"
                                          }
                                        | {
                                            id: string
                                            object: "user"
                                          }
                                    }
                                  | {
                                      type: "workspace"
                                      workspace: true
                                    }
                              }
                          name: string | null
                          avatar_url: string | null
                          id: string
                          object: "user"
                        }
                  }
                | {
                    type: "last_edited_time"
                    last_edited_time: string
                  }
                | {
                    type: "last_edited_by"
                    last_edited_by:
                      | {
                          id: string
                          object: "user"
                        }
                      | {
                          type: "person"
                          person: {
                            email?: string
                          }
                          name: string | null
                          avatar_url: string | null
                          id: string
                          object: "user"
                        }
                      | {
                          type: "bot"
                          bot:
                            | EmptyObject
                            | {
                                owner:
                                  | {
                                      type: "user"
                                      user:
                                        | {
                                            type: "person"
                                            person: {
                                              email: string
                                            }
                                            name: string | null
                                            avatar_url: string | null
                                            id: string
                                            object: "user"
                                          }
                                        | {
                                            id: string
                                            object: "user"
                                          }
                                    }
                                  | {
                                      type: "workspace"
                                      workspace: true
                                    }
                              }
                          name: string | null
                          avatar_url: string | null
                          id: string
                          object: "user"
                        }
                  }
              >
              function:
                | "count"
                | "count_values"
                | "empty"
                | "not_empty"
                | "unique"
                | "show_unique"
                | "percent_empty"
                | "percent_not_empty"
                | "sum"
                | "average"
                | "median"
                | "min"
                | "max"
                | "range"
                | "earliest_date"
                | "latest_date"
                | "date_range"
                | "checked"
                | "unchecked"
                | "percent_checked"
                | "percent_unchecked"
                | "show_original"
            }
          | {
              type: "unsupported"
              unsupported: EmptyObject
              function:
                | "count"
                | "count_values"
                | "empty"
                | "not_empty"
                | "unique"
                | "show_unique"
                | "percent_empty"
                | "percent_not_empty"
                | "sum"
                | "average"
                | "median"
                | "min"
                | "max"
                | "range"
                | "earliest_date"
                | "latest_date"
                | "date_range"
                | "checked"
                | "unchecked"
                | "percent_checked"
                | "percent_unchecked"
                | "show_original"
            }
        id: string
      }
  >
  icon:
    | {
        type: "emoji"
        emoji: string
      }
    | null
    | {
        type: "external"
        external: {
          url: string
        }
      }
    | null
    | {
        type: "file"
        file: {
          url: string
          expiry_time: string
        }
      }
    | null
  cover:
    | {
        type: "external"
        external: {
          url: string
        }
      }
    | null
    | {
        type: "file"
        file: {
          url: string
          expiry_time: string
        }
      }
    | null
  object: "page"
  id: string
  created_time: string
  last_edited_time: string
  archived: boolean
  url: string
}

const ignoredPpt = { name: "_gen_ignored" }

export function isNotIgnoredPage(page: Page): boolean {
  return !isIgnoredPage(page)
}
export function isIgnoredPage(page: Page): boolean {
  const ignored = getPageCheckbox(page, ignoredPpt)
  return !!ignored
}
export function isNotEmptyPage(page: Page): boolean {
  return !isEmptyPage(page)
}
export function isEmptyPage(page: Page): boolean {
  return Object.keys(page.properties).every((key) => {
    const ppt = page.properties[key]
    switch (ppt.type) {
      case "checkbox":
        return !ppt.checkbox
      case "date":
        return ppt.date === undefined || ppt.date === null
      case "email":
        return !ppt.email
      case "files":
        return ppt.files.length === 0
      case "multi_select":
        return ppt.multi_select.length === 0
      case "number":
        return ppt.number === undefined || ppt.number === null
      case "people":
        return ppt.people.length === 0
      case "phone_number":
        return !ppt.phone_number
      case "relation":
        return ppt.relation.length === 0
      case "rich_text":
        return ppt.rich_text.length === 0
      case "select":
        return ppt.select === undefined || ppt.select === null
      case "title":
        return ppt.title.length === 0
      // always defined
      case "created_by":
      case "created_time":
      case "formula":
      case "last_edited_by":
      case "last_edited_time":
      case "rollup":
      case "url":
        return true
      default:
        throw `Unknown property: ${key} for page ${pageId(page)}`
    }
  })
}

export function pageId(page: Page): string {
  try {
    const name = getPageName(page)
    return name ? `${page.id}(${name})` : JSON.stringify(page)
  } catch (_e) {
    return page.id
  }
}

export function getPageName(page: Page): string | undefined {
  const ppt = page.properties["Name"] as TitlePropertyValue | undefined
  const name =
    ppt &&
    ppt.type === "title" &&
    ppt.title &&
    ppt.title[0] &&
    ppt.title[0].plain_text
  return name || undefined
}

export function getPageNameOrFail(page: Page): string {
  const name = getPageName(page)
  if (!name) {
    const emptyLabel = isEmptyPage(page) ? "empty" : "not empty"
    throw new Error(`Missing page name in ${emptyLabel} page ${pageId(page)}`)
  }
  return name
}

export function getPageRelationOrFail(
  page: Page,
  property: { name: string }
): string[] {
  const ppt = page.properties[property.name] as unknown as
    | { type: "relation"; relation: { id: string }[] }
    | undefined
  if (ppt && ppt.type !== "relation") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a relation in page ${pageId(
        page
      )}`
    )
  }
  const relation = ppt?.relation
  if (relation === undefined) {
    throw new Error(
      `Missing relation ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return relation.map((r) => r.id)
}

export function getPageSingleRelationOrFail(
  page: Page,
  property: { name: string },
  entryById?: Map<string, any> | undefined
): string {
  const relations = getPageRelationOrFail(page, property)
  const filtered = entryById
    ? relations.filter((e) => entryById.has(e))
    : relations
  if (filtered.length !== 1) {
    const pId = pageId(page)
    if (relations.length === 0) {
      throw new Error(
        `Relation ${JSON.stringify(property)} has no element in page ${pId}`
      )
    } else if (filtered.length === 0) {
      throw new Error(
        `Relation ${JSON.stringify(
          property
        )} has no not-archived element in page ${pId} (archived relations are ${relations.join(
          ", "
        )})`
      )
    } else if (entryById) {
      throw new Error(
        `Relation ${JSON.stringify(
          property
        )} has too many not-archived elements in page ${pId} (${filtered
          .map((id) => entryById.get(id)?.name ?? id)
          .join(", ")})`
      )
    } else {
      throw new Error(
        `Relation ${JSON.stringify(
          property
        )} has too many elements in page ${pId}`
      )
    }
  }
  return filtered[0]
}

export function getPageCheckboxOrFail(
  page: Page,
  property: { name: string }
): boolean {
  const checkbox = getPageCheckbox(page, property)
  if (checkbox === undefined) {
    throw new Error(
      `Missing checkbox ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return checkbox
}
export function getPageCheckbox(
  page: Page,
  property: { name: string }
): boolean | undefined {
  const ppt = page.properties[property.name] as
    | CheckboxPropertyValue
    | undefined
  if (ppt && ppt.type !== "checkbox") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a checkbox in page ${pageId(
        page
      )}`
    )
  }
  return ppt?.checkbox
}

export function getPageSelectOrFail(
  page: Page,
  property: { name: string }
): string {
  const ppt = page.properties[property.name] as SelectPropertyValue | undefined
  if (ppt && ppt.type !== "select") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a select in page ${pageId(
        page
      )}`
    )
  }
  const select = ppt?.select
  if (select === undefined || select === null) {
    throw new Error(
      `Missing select ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return select.name
}

export function getPageMultiselectOrFail(
  page: Page,
  property: { name: string }
): string[] {
  const ppt = page.properties[property.name] as PropertyBase | undefined
  if (ppt && ppt.type !== "multi_select") {
    throw new Error(
      `Property ${JSON.stringify(property)} in not a select in page ${pageId(
        page
      )}`
    )
  }
  const multiSelect = (ppt as { multi_select: { name: string }[] } | undefined)
    ?.multi_select
  if (multiSelect === undefined) {
    throw new Error(
      `Missing multi_select ${JSON.stringify(property)} in page ${pageId(page)}`
    )
  }
  return multiSelect.map((s) => s.name)
}
